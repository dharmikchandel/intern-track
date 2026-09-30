import { type ButtonHTMLAttributes, forwardRef } from "react";
import { neoButtonClass, type NeoButtonVariant } from "./neoButtonStyles";

interface NeoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: NeoButtonVariant;
}

const NeoButton = forwardRef<HTMLButtonElement, NeoButtonProps>(
    ({ className, variant = "primary", ...props }, ref) => {
        return <button ref={ref} className={neoButtonClass(variant, className)} {...props} />;
    }
);
NeoButton.displayName = "NeoButton";

export { NeoButton };
