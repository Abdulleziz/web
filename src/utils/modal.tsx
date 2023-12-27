import type { LabelHTMLAttributes } from "react";

type Props = {
  children: string | JSX.Element | JSX.Element[] | null;
};

/**
 * @deprecated use shadcn/ui modal instead
 */
export const createModal = (
  id: string,
  openText: string | React.ReactNode,
  isOpen?: boolean,
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const Modal = ({ children }: Props) => {
    return (
      <>
        <input
          type="checkbox"
          id={id}
          className="modal-toggle"
          checked={isOpen}
          onChange={() => setOpen && setOpen(false)}
        />
        <label key={id} htmlFor={id} className="modal cursor-pointer">
          <label className="modal-box relative" htmlFor="">
            {children}
            <div className="modal-action">
              {/* render close button when setOpen is defined or isOpen is not defined */}
              {(setOpen || isOpen === undefined) && (
                <label
                  htmlFor={id}
                  className="btn"
                  onClick={() => setOpen && setOpen(false)}
                >
                  Kapat
                </label>
              )}
            </div>
          </label>
        </label>
      </>
    );
  };

  const ModalTrigger = (props: LabelHTMLAttributes<HTMLLabelElement>) => {
    return (
      <label {...props} htmlFor={id}>
        {openText}
      </label>
    );
  };
  return { Modal, ModalTrigger };
};
