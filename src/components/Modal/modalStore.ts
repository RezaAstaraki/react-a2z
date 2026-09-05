import { ReactNode } from "react"
import { create } from "zustand"
import { devtools } from "zustand/middleware"

export type ModalSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "full"

export type ModalPlacement =
  | "auto"
  | "bottom"
  | "bottom-center"
  | "center"
  | "top"
  | "top-center"

export type ModalBackdrop = "opaque" | "blur" | "transparent"

export type ModalScrollBehavior = "inside" | "normal" | "outside"

export type ModalEntry = {
  id: string
  type: string
  size?: ModalSize
  payloadData?: unknown | null
  isCloseAllowed?: boolean
  scrollBehavior: ModalScrollBehavior
  isDismissible?: boolean
  placement?: ModalPlacement
  backdrop?: ModalBackdrop
  isDraggable?: boolean
  showCloseButton?: boolean
  zIndex: number
  className?: string
  bodyClassName?: string
  contentClassName?: string
  modalTitle?: string
  modalIconName?: string
  modalIconColor?: string
  modalTitleColor?: string
  modalBgIcon?: string
  modalBorderColor?: string
  modalDescription?: string
  stackable?: boolean
}

type ModalStoreState = {
  stack: ModalEntry[]
  /** Bumps when content map changes so subscribers re-render. */
  contentKey: number
}

export type SetModalOpenPayload = Omit<Partial<ModalEntry>, "id" | "zIndex"> & {
  type?: string
  content?: ReactNode
  /** When true, later modals can open on top of this one. When false, they replace it. */
  stackable?: boolean
}

const BASE_Z_INDEX = 50
const Z_INDEX_STEP = 10

const defaultEntryFields = {
  type: "",
  payloadData: null as unknown | null,
  isDismissible: true,
  placement: "center" as ModalPlacement,
  isDraggable: true,
  showCloseButton: true,
  className: undefined as string | undefined,
  bodyClassName: undefined as string | undefined,
  contentClassName: undefined as string | undefined,
  modalTitle: undefined as string | undefined,
  modalIconName: undefined as string | undefined,
  modalIconColor: undefined as string | undefined,
  modalTitleColor: undefined as string | undefined,
  modalBgIcon: undefined as string | undefined,
  modalBorderColor: undefined as string | undefined,
  modalDescription: undefined as string | undefined,
  isCloseAllowed: true,
  scrollBehavior: "inside" as ModalScrollBehavior,
  backdrop: "blur" as ModalBackdrop,
  stackable: false,
  size: undefined as ModalSize | undefined,
}

/** Kept outside Zustand so Redux DevTools never serializes React nodes. */
const modalContentById = new Map<string, ReactNode>()

let modalIdCounter = 0
const createModalId = () => {
  modalIdCounter += 1
  return `modal-${modalIdCounter}`
}

export const getModalContent = (id: string) =>
  modalContentById.get(id) ?? null

export const useModalStore = create<ModalStoreState>()(
  devtools(
    () => ({
      stack: [] as ModalEntry[],
      contentKey: 0,
    }),
    {
      name: "modalStore",
      enabled: (globalThis as { process?: { env?: { NODE_ENV?: string } } })
        .process?.env?.NODE_ENV !== "production",
    }
  )
)

export const setModalOpen = (payload: SetModalOpenPayload = {}) => {
  const { content, stackable = false, ...rest } = payload
  const id = createModalId()
  const currentStack = useModalStore.getState().stack
  const top = currentStack[currentStack.length - 1]
  const shouldStack = Boolean(top?.stackable)

  const entry: ModalEntry = {
    ...defaultEntryFields,
    ...rest,
    id,
    zIndex: shouldStack
      ? top!.zIndex + Z_INDEX_STEP
      : top
        ? top.zIndex
        : BASE_Z_INDEX,
    stackable,
    type: rest.type ?? defaultEntryFields.type,
    scrollBehavior: rest.scrollBehavior ?? defaultEntryFields.scrollBehavior,
  }

  modalContentById.set(id, content ?? null)

  if (shouldStack) {
    useModalStore.setState((state) => ({
      stack: [...state.stack, entry],
      contentKey: state.contentKey + 1,
    }))
    return
  }

  if (top) {
    modalContentById.delete(top.id)
    useModalStore.setState((state) => ({
      stack: [...state.stack.slice(0, -1), entry],
      contentKey: state.contentKey + 1,
    }))
    return
  }

  useModalStore.setState((state) => ({
    stack: [entry],
    contentKey: state.contentKey + 1,
  }))
}

export const setModalClose = (id?: string) => {
  const { stack } = useModalStore.getState()
  if (stack.length === 0) return

  const targetId = id ?? stack[stack.length - 1]!.id
  const target = stack.find((item) => item.id === targetId)
  if (!target) return

  if (target.isCloseAllowed === false) return

  modalContentById.delete(targetId)

  useModalStore.setState((state) => ({
    stack: state.stack.filter((item) => item.id !== targetId),
    contentKey: state.contentKey + 1,
  }))
}

export const setAllowClose = (id?: string) => {
  useModalStore.setState((state) => {
    if (state.stack.length === 0) return state
    const targetId = id ?? state.stack[state.stack.length - 1]!.id
    return {
      stack: state.stack.map((item) =>
        item.id === targetId ? { ...item, isCloseAllowed: true } : item
      ),
    }
  })
}

export const setDisallowAClose = (id?: string) => {
  useModalStore.setState((state) => {
    if (state.stack.length === 0) return state
    const targetId = id ?? state.stack[state.stack.length - 1]!.id
    return {
      stack: state.stack.map((item) =>
        item.id === targetId ? { ...item, isCloseAllowed: false } : item
      ),
    }
  })
}
