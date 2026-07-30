'use client';

import { createContext, useContext } from 'react';

/**
 * Turns the `<T>` wrappers into editable fields. Only the MIS landing editor
 * renders this provider — the public pages never do, so `editing` is false
 * there and `<T>` emits no markup at all.
 *
 * This gates UI only. Every write is re-checked server-side in
 * `src/lib/cms/guard.ts`.
 */
const EditableContext = createContext(false);

export function useEditing() {
    return useContext(EditableContext);
}

export function EditableProvider({ editing, children }: { editing: boolean; children: React.ReactNode }) {
    return <EditableContext.Provider value={editing}>{children}</EditableContext.Provider>;
}
