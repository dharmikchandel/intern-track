import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { getToasts, notify, showParkedToast } from "../src/lib/toast";

afterEach(() => {
    for (const t of [...getToasts()]) notify.dismiss(t.id);
    // @ts-expect-error test stub
    delete globalThis.sessionStorage;
});

function stubStorage(initial: Record<string, string> = {}) {
    const data = new Map(Object.entries(initial));
    // @ts-expect-error test stub
    globalThis.sessionStorage = {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
    };
    return data;
}

describe("toast store", () => {
    it("durations: success 4s, info 5s, undo 8s, errors stay", () => {
        const duration = (id: string) => {
            const found = getToasts().find((t) => t.id === id)!.duration;
            notify.dismiss(id);
            return found;
        };
        assert.equal(duration(notify.success("a")), 4000);
        assert.equal(duration(notify.info("b")), 5000);
        assert.equal(duration(notify.info("c", { action: { label: "Undo", undo: true } })), 8000);
        assert.equal(duration(notify.error("d")), 0);
        assert.equal(duration(notify.milestone("e", { action: { label: "See all", to: "/profile" } })), 7000);
    });

    it("reusing an id replaces in place, keeps its place and bumps the version", () => {
        notify.info("first", { id: "move" });
        notify.success("other");
        notify.info("second", { id: "move" });
        const list = getToasts();
        assert.deepEqual(list.map((t) => t.message), ["second", "other"]);
        assert.equal(list[0].version, 2);
    });

    it("keeps at most three, dropping the oldest", () => {
        for (const m of ["1", "2", "3", "4"]) notify.success(m);
        assert.deepEqual(getToasts().map((t) => t.message), ["2", "3", "4"]);
    });

    it("dismiss removes one and ignores unknown ids", () => {
        const id = notify.success("x");
        notify.dismiss("nope");
        assert.equal(getToasts().length, 1);
        notify.dismiss(id);
        assert.equal(getToasts().length, 0);
    });

    it("clips very long text (server messages are not trusted for length)", () => {
        notify.error("x".repeat(1000), { description: "y".repeat(1000) });
        const [t] = getToasts();
        assert.equal(t.message.length, 200);
        assert.equal(t.description?.length, 300);
    });

    it("keeps markup as plain text (it is only ever rendered as a text node)", () => {
        notify.success("<img src=x onerror=alert(1)>");
        assert.equal(getToasts()[0].message, "<img src=x onerror=alert(1)>");
    });
});

describe("toast parked across a reload", () => {
    it("is shown once, then gone", () => {
        const data = stubStorage();
        notify.afterReload("success", "Your account was deleted.");
        assert.equal(getToasts().length, 0);
        showParkedToast();
        assert.deepEqual(getToasts().map((t) => [t.kind, t.message]), [["success", "Your account was deleted."]]);
        assert.equal(data.size, 0);
        showParkedToast();
        assert.equal(getToasts().length, 1);
    });

    it("ignores anything that is not a known kind and a string", () => {
        for (const raw of ['{"kind":"danger","message":"x"}', '{"kind":"info","message":5}', "[]", "null", "not json", '"str"']) {
            stubStorage({ "interntrack:flash-toast": raw });
            showParkedToast();
        }
        assert.equal(getToasts().length, 0);
    });

    it("does nothing when storage is unavailable", () => {
        assert.doesNotThrow(() => notify.afterReload("info", "x"));
        assert.doesNotThrow(() => showParkedToast());
    });
});
