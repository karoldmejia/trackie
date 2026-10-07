import { DailyLogForm } from '@/components/home/DailyLogForm';
import { useDailyLogEditor } from '@/hooks/useDailyLogEditor';
import React, { forwardRef, useImperativeHandle } from 'react';

export interface DailyLogEditorHandle {
    open: (log: any) => void;
}

interface Props {
    onSaved?: () => void | Promise<void>;
}

export const DailyLogEditorHost = forwardRef<DailyLogEditorHandle, Props>(
    ({ onSaved }, ref) => {
        const editor = useDailyLogEditor({ onSaved });

        useImperativeHandle(ref, () => ({ open: editor.open }), [editor.open]);

        return (
            <DailyLogForm
                visible={editor.visible}
                onClose={editor.close}
                onSubmit={editor.submit}
                initialData={editor.initialData}
                title="Editar Registro"
                hideDatePicker={true}
            />
        );
    },
);