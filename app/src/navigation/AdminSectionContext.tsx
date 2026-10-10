import React, {createContext, PropsWithChildren, useContext} from 'react';

export type AdminSection = 'Overview' | 'Users' | 'Subjects' | 'Review' | 'Reports' | 'Campus';
type AdminSectionContextValue = {section: AdminSection; setSection: (section: AdminSection) => void};
const AdminSectionContext = createContext<AdminSectionContextValue | null>(null);

export function AdminSectionProvider({value, children}: PropsWithChildren<{value: AdminSectionContextValue}>): React.JSX.Element {
  return <AdminSectionContext.Provider value={value}>{children}</AdminSectionContext.Provider>;
}

export function useAdminSection(): AdminSectionContextValue | null {
  return useContext(AdminSectionContext);
}
