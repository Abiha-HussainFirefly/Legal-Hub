import CaseWorkspace from '@/app/components/cases/case-workspace';

export default function CasesLayout({ children }: { children: React.ReactNode }) {
  return <CaseWorkspace>{children}</CaseWorkspace>;
}
