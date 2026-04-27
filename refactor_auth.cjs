const fs = require('fs');
const path = require('path');

function refactor(filePath, title, description) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Inject AuthShell import
  if (!content.includes('AuthShell')) {
    content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport AuthShell from "@/app/components/ui/auth/auth-shell";');
  }

  // Remove the old LEFT PANEL layout and wrap in AuthShell
  const regex = /<div className="flex flex-col lg:flex-row [^>]+>[\s\S]*?\{\/\* RIGHT PANEL \*\/\}[\s\S]*?<div className="[^"]+">[\s\S]*?<div className="[^"]+">/;

  if (regex.test(content)) {
    content = content.replace(regex, `<AuthShell title="${title}" description="${description}">`);
    
    // Close the AuthShell
    // Usually we have 3 or 4 closing divs before the end of the return
    content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\);/g, '</AuthShell>);');
    content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);/g, '</div></AuthShell>);');
  }

  // Mobile logo
  content = content.replace(/<Image\s*src="\/logo-legal-hub\.png"\s*alt="Legal Hub"\s*width=\{155\}\s*height=\{44\}\s*className="mx-auto"\s*\/>/g, '<Image src="/logo-legal-hub.png" alt="Legal Hub" width={155} height={44} className="mx-auto lg:hidden" />');

  // Update Google Auth button styling
  content = content.replace(/<button[^>]*?>\s*<GoogleIcon \/>\s*<\/button>/g, '<button type="button" onClick={() => signIn("google", { callbackUrl: "/discussions" })} className="w-full flex items-center justify-center gap-3 p-3 border-[1.5px] border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-[#4C2F5E]/30 transition-all cursor-pointer shadow-sm text-sm font-bold text-[#332043]"><GoogleIcon /> Continue with Google</button>');

  // Same for Facebook button styling
  content = content.replace(/<button[^>]*?>\s*<FacebookIcon \/>\s*<\/button>/g, '<button type="button" className="w-full flex items-center justify-center gap-3 p-3 border-[1.5px] border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-[#4C2F5E]/30 transition-all cursor-pointer shadow-sm text-sm font-bold text-[#332043]"><FacebookIcon /> Continue with Facebook</button>');

  // Some forms had them side by side
  content = content.replace(/<div className="flex gap-3 mb-5">([\s\S]*?)<\/div>/g, (match, inner) => {
    if (inner.includes('Continue with')) {
        return `<div className="flex flex-col gap-3 mb-5">${inner}</div>`;
    }
    return match;
  });

  // Specifically for Register page which has tooltip wrapped buttons
  content = content.replace(/<div className="flex gap-3 mb-4\.5">([\s\S]*?)<\/div>/g, (match, inner) => {
    return `<div className="flex flex-col gap-3 mb-5">${inner}</div>`;
  });

  fs.writeFileSync(filePath, content);
}

const files = [
    ['app/components/ui/auth/login.tsx', 'Welcome Back', 'Sign in to access your dashboard and continue your work.'],
    ['app/(auth)/lawyerregister/page.tsx', 'Join the Legal Community', 'Connect with verified lawyers, get legal advice, and manage your case all one place'],
    ['app/(auth)/clientregister/page.tsx', 'Join the Legal Community', 'Connect with verified lawyers, get legal advice, and manage your case all one place'],
    ['app/(auth)/clientlogin/page.tsx', 'Welcome Back', 'Sign in to access your dashboard and continue your work.'],
    ['app/(auth)/forgot-password/page.tsx', 'Reset Password', 'Enter your email to receive a password reset link.'],
    ['app/(auth)/reset-password/page.tsx', 'Create New Password', 'Set a new password for your account.'],
    ['app/(auth)/verify-email/page.tsx', 'Verify Email', 'Enter the 6-digit code sent to your email to verify your account.']
];

for (const [file, title, desc] of files) {
    if (fs.existsSync(file)) {
        console.log(`Refactoring ${file}...`);
        refactor(file, title, desc);
    }
}
