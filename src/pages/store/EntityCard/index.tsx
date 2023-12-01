import { Card, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { SystemEntity } from "~/utils/entities";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useCheckout } from "..";
import { useHydrated } from "~/pages/_app";

const EntityCard = ({ entity }: { entity?: SystemEntity }) => {
  const hydrated = useHydrated();
  const store = useCheckout((state) => state.items);
  const items = hydrated ? store : [];
  const addItems = useCheckout((state) => state.addItems);
  const removeItems = useCheckout((state) => state.removeItems);

  if (!entity) return null;
  const itemAmount = items.find((i) => i[0] === entity.id)?.[1] ?? 0;
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-3">
      <Avatar>
        <AvatarImage src={entity.image} />
        <AvatarFallback>{entity.type}</AvatarFallback>
      </Avatar>
      <EntityDetails entity={entity} />
      <p>{entity.price}$</p>
      <p>has {itemAmount}</p>
      <div className="flex gap-2">
        <Button variant={"default"} onClick={() => addItems([entity.id])}>
          +
        </Button>
        <Button
          variant={itemAmount !== 1 ? "default" : "destructive"}
          onClick={() => removeItems([entity.id])}
          disabled={itemAmount === 0}
        >
          -
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
