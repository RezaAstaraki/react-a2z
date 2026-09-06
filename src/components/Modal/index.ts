export { default as GlobalModal } from './GlobalModal';
export { CustomModal } from './CustomModal';
export type { CustomModalProps } from './CustomModal';
export {
  useModalStore,
  setModalOpen,
  setModalClose,
  setAllowClose,
  setDisallowAClose,
  getModalContent,
} from './modalStore';
export type {
  ModalSize,
  ModalPlacement,
  ModalBackdrop,
  ModalScrollBehavior,
  ModalVariant,
  ModalEntry,
  SetModalOpenPayload,
} from './modalStore';
