import type { ApplicationStatus, BoardResponse } from "../../api/applications";

// Pure cache transform for the optimistic drag: take the card out of its
// column and put it at the top of the target one, keeping both totals right.
// The server's ordering is restored by the refetch after the mutation settles.
export function moveCardInBoard(board: BoardResponse, id: string, to: ApplicationStatus): BoardResponse {
    const card = board.columns.flatMap((c) => c.items).find((a) => a.id === id);
    if (!card || card.status === to) return board;

    const moved = { ...card, status: to };
    return {
        ...board,
        columns: board.columns.map((col) => {
            if (col.status === card.status) {
                return { ...col, total: col.total - 1, items: col.items.filter((a) => a.id !== id) };
            }
            if (col.status === to) {
                return { ...col, total: col.total + 1, items: [moved, ...col.items] };
            }
            return col;
        }),
    };
}
