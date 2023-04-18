import type { LabelHTMLAttributes } from "react";
import React from "react";

type Props = {
  children: string | JSX.Element | JSX.Element[] | null;
};

export const createModal = (
  id: string,
  openText: string,
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
        <label htmlFor={id} className="modal cursor-pointer">
          <label className="modal-box relative" htmlFor="">
            {children}
            <div className="modal-action">
              <label
                htmlFor={id}
                className="btn"
                onClick={() => setOpen && setOpen(false)}
              >
                Kapat
              </label>
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
