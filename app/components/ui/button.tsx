import * as React from "react";

// Define variants based on the project's design system
const variants = {
  primary:
    "bg-[#4C2F5E] border border-[#4C2F5E] py-[14px] text-white font-semibold px-6 w-full text-[16px] hover:bg-[#432853] hover:border-[#432853] transition-colors",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm py-2 px-4",
  outline:
    "bg-transparent border border-[#4C2F5E]/15 text-foreground hover:bg-[#F7F3FA] py-2 px-4",
  "outline-white":
    "bg-white border border-[#4C2F5E]/12 text-foreground hover:bg-[#F7F3FA] py-2 px-4",
  ghost: "bg-transparent border-transparent text-foreground hover:bg-[#F7F3FA] py-2 px-4",
  link: "bg-transparent border-transparent text-[#4C2F5E] underline-offset-4 hover:underline p-0 h-auto",
  gradient:
    "bg-[#4C2F5E] text-white border border-[#4C2F5E] hover:bg-[#432853] hover:border-[#432853] transition-colors py-3 px-6",
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
      "inline-flex min-w-0 items-center justify-center rounded-[14px] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4C2F5E]/10 disabled:pointer-events-none disabled:opacity-50 cursor-pointer whitespace-nowrap gap-2 leading-tight font-inherit [&>svg]:shrink-0";

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
