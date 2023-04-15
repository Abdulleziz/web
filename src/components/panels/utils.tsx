import { type LabelHTMLAttributes } from "react";
import type { AbdullezizPerm } from "~/utils/abdulleziz";

export const createPanel = <T, V extends AbdullezizPerm[] | undefined>(
  visibleBy: V,
  Component: React.FC<T>
) => {
  const PanelComponent = Component as React.FC<T> & { visibleBy: V };
  PanelComponent.visibleBy = visibleBy;
  return PanelComponent;
};

type Props = {
  children: string | JSX.Element | JSX.Element[] | null;
};

export const createModal = (id: string, openText: string) => {
  const Modal = ({ children }: Props) => {
    return (
      <>
        <input
          defaultChecked={true}
          type="checkbox"
          id={id}
          className="modal-toggle"
        />
        <label htmlFor={id} className="modal cursor-pointer">
          <label className="modal-box relative" htmlFor="">
            {children}
            <div className="modal-action">
              <label htmlFor={id} className="btn">
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
