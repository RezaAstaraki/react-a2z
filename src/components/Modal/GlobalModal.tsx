'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { CustomModal } from './CustomModal';
import {
  getModalContent,
  setModalClose,
  useModalStore,
} from './modalStore';

export default function GlobalModal() {
  const stack = useModalStore((state) => state.stack);
  const contentKey = useModalStore((state) => state.contentKey);
  void contentKey;

  useEffect(() => {
    if (stack.length === 0) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [stack.length]);

  return (
    <>
      {stack.map((modal, index) => (
        <CustomModal
          key={modal.id}
          isOpen
          onClose={() => setModalClose(modal.id)}
          title={modal.modalTitle}
          size={modal.size}
          placement={modal.placement}
          backdrop={modal.backdrop}
          scrollBehavior={modal.scrollBehavior}
          isDismissible={modal.isDismissible}
          showCloseButton={modal.showCloseButton}
          isDraggable={modal.isDraggable}
          headerDraggable={modal.isDraggable}
          zIndex={modal.zIndex}
          className={modal.className}
          bodyClassName={modal.bodyClassName}
          contentClassName={modal.contentClassName}
          stackable={modal.stackable}
          isTop={index === stack.length - 1}
        >
          {getModalContent(modal.id)}
        </CustomModal>
      ))}
    </>
  );
}
