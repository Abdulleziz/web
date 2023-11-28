import { Card, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { SystemEntity } from "~/utils/entities";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useCheckout } from "..";

const EntityCard = ({ entity }: { entity?: SystemEntity }) => {
  const addItems = useCheckout((state) => state.addItems);
  if (!entity) return null;
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-3">
      <Avatar>
        <AvatarImage src={entity.image} />
        <AvatarFallback>{entity.type}</AvatarFallback>
      </Avatar>
      <EntityDetails entity={entity} />
      <p>{entity.price}$</p>
      <Button onClick={() => addItems([entity.id])}>Sepete Ekle</Button>
    </Card>
  );
};

const EntityDetails = ({ entity }: { entity: SystemEntity }): JSX.Element => {
  switch (entity.type) {
    case "tea":
      return (
        <CardTitle>
          {entity.tea.name} {entity.tea.amountGram}gr
        </CardTitle>
      );

    case "phone":
      return (
        <CardTitle>
          {entity.phone.brand} {entity.phone.model}
        </CardTitle>
      );

    case "car":
      return (
        <CardTitle>
          {entity.car.brand} {entity.car.model}
          {entity.car.year}
        </CardTitle>
      );
  }
};

export default EntityCard;
