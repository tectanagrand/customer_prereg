import { create } from "zustand";

const useToggleBackdrop = create(set => ({
    backdropState: false,
    openBackdrop: () => set(true),
    closeBackdrop: () => set(false),
}));

export default useToggleBackdrop;
