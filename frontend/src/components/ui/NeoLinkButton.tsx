import { forwardRef } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { neoButtonClass, type NeoButtonVariant } from "./neoButtonStyles";

interface NeoLinkButtonProps extends LinkProps {
    variant?: NeoButtonVariant;
}

// A router link that looks like a NeoButton. Use it for navigation; use
// NeoButton for actions. Never put a <button> inside a <Link>.
const NeoLinkButton = forwardRef<HTMLAnchorElement, NeoLinkButtonProps>(
    ({ className, variant = "primary", ...props }, ref) => {
        return <Link ref={ref} className={neoButtonClass(variant, className)} {...props} />;
    }
);
NeoLinkButton.displayName = "NeoLinkButton";

export { NeoLinkButton };
