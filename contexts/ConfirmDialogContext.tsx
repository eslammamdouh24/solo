import { ConfirmationBottomSheet } from "@/components/ConfirmationBottomSheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn>(async () => false);

export const useConfirm = () => useContext(ConfirmDialogContext);

interface DialogState extends ConfirmOptions {
  visible: boolean;
}

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<DialogState>({
    visible: false,
    title: "",
    message: "",
  });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ ...options, visible: true });
    });
  }, []);

  const handleResolve = useCallback((value: boolean) => {
    setState((s) => ({ ...s, visible: false }));
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <ConfirmationBottomSheet
        visible={state.visible}
        title={state.title}
        message={state.message}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        confirmColor={state.confirmColor}
        icon={state.icon}
        iconColor={state.iconColor}
        onConfirm={() => handleResolve(true)}
        onClose={() => handleResolve(false)}
      />
    </ConfirmDialogContext.Provider>
  );
};
