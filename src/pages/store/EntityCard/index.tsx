import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { SystemEntity } from "~/utils/entities";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useCheckout } from "..";
import { toast } from "react-hot-toast";

const EntityCard = ({ entity }: { entity?: SystemEntity }) => {
  const addItems = useCheckout((state) => state.addItems);

  const onAddCart = (entityId: number) => {
    toast("Sepete Eklendi!");
    addItems([entityId]);
  };

  if (!entity) return null;
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-3">
      <Avatar>
        <AvatarImage
          src={entity.image}
          className="h-40 w-40"
          width={250}
          height={250}
        />
        <AvatarFallback>{entity.type}</AvatarFallback>
      </Avatar>
      <EntityDetails entity={entity} />
      <p>{entity.price}$</p>
      <div className="flex gap-2">
        <Button variant={"default"} onClick={() => onAddCart(entity.id)}>
          Sepete Ekle
        </Button>
      </div>
    </Card>
  );
};

export const EntityDetails = ({
  entity,
}: {
  entity: SystemEntity;
}): JSX.Element => {
  switch (entity.type) {
    case "tea":
      return <span>{`${entity.tea.name} ${entity.tea.amountGram} gr`}</span>;

    case "phone":
      return <span>{`${entity.phone.brand} ${entity.phone.model}`}</span>;

    case "human":
      return <span>{`${entity.human.name} ${entity.human.surname}`}</span>;

    case "car":
      return (
        <span>{`${entity.car.brand} ${entity.car.model} ${entity.car.year}`}</span>
      );

    case "privilege":
      return <span>{entity.privilege.name}</span>;
  }
};

export default EntityCard;
