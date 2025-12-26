import toast, { ToastOptions } from 'react-hot-toast';
import { playSuccessSound, playErrorSound } from './sound';

export const notify = {
    success: (message: string, options?: ToastOptions) => {
        playSuccessSound();
        toast.success(message, options);
    },
    error: (message: string, options?: ToastOptions) => {
        playErrorSound();
        toast.error(message, options);
    },
    loading: (message: string) => {
        return toast.loading(message);
    },
    dismiss: toast.dismiss,
    custom: toast.custom
};
