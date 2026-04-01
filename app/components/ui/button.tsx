import * as React from "react";

// Define variants based on the project's design system
const variants = {
  primary:
    "bg-[#9F63C4] border-transparent shadow-sm py-[14px] text-white font-semibold px-6 w-full text-[18px] hover:opacity-90 transition-opacity",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm py-2 px-4",
  outline:
    "bg-transparent border border-gray-300 text-foreground hover:bg-gray-50 py-2 px-4",
  "outline-white":
    "bg-white border border-gray-200 text-foreground hover:bg-gray-100 py-2 px-4",
  ghost: "bg-transparent border-transparent text-foreground hover:bg-gray-50 py-2 px-4",
  link: "bg-transparent border-transparent text-[#9F63C4] underline-offset-4 hover:underline p-0 h-auto",
  gradient:
    "bg-gradient-to-r from-[#4C2F5E] to-[#9F63C4] text-white border-transparent hover:opacity-90 shadow-md transition-opacity py-3 px-6",
};

const sizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  icon: "flex items-center justify-center p-2",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      style,
      ...props
    },
    ref,
  ) => {
    const baseClass =
      "inline-flex items-center justify-center rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#9F63C4] disabled:pointer-events-none disabled:opacity-50 cursor-pointer whitespace-nowrap gap-2 font-inherit";

    const variantClass = variants[variant];
    const sizeClass = sizes[size];

    const finalClass = `${baseClass} ${sizeClass} ${variantClass} ${className}`;

    return (
      <button
        ref={ref}
        className={finalClass}
        disabled={isLoading || disabled}
        style={style}
        {...props}
      >
        {isLoading && (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
