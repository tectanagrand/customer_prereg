import { create } from "zustand";

const useToggleBackdrop = create(set => ({
    backdropState: false,
    openBackdrop: () => set({ backdropState: true }),
    closeBackdrop: () => set({ backdropState: false }),
}));

export default useToggleBackdrop;
