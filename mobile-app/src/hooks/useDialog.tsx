import { useState, useCallback } from 'react';
import ModernDialog, { DialogType } from '../components/ModernDialog';

export type DialogConfig = {
  title: string;
  message?: string;
  type?: DialogType;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
};

export function useDialog() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<DialogConfig>({ title: '' });

  const showDialog = useCallback((cfg: DialogConfig) => {
    setConfig({
      title: cfg.title,
      message: cfg.message,
      type: cfg.type ?? 'info',
      primaryLabel: cfg.primaryLabel ?? 'OK',
      onPrimaryPress: cfg.onPrimaryPress,
      secondaryLabel: cfg.secondaryLabel,
      onSecondaryPress: cfg.onSecondaryPress,
    });
    setVisible(true);
  }, []);

  const hideDialog = useCallback(() => setVisible(false), []);

  const DialogPortal = useCallback(() => (
    <ModernDialog
      visible={visible}
      title={config.title}
      message={config.message}
      type={config.type}
      primaryLabel={config.primaryLabel}
      onPrimaryPress={config.onPrimaryPress}
      secondaryLabel={config.secondaryLabel}
      onSecondaryPress={config.onSecondaryPress}
      onClose={hideDialog}
    />
  ), [visible, config, hideDialog]);

  return { showDialog, hideDialog, DialogPortal } as const;
}