
import { Card, CardTitle } from "~/components/ui/card";
import { CurrentAvatar } from "~/components/CurrentAvatar";
import { Button } from "~/components/ui/button";
const ItemCard = () => {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-3">
      <CurrentAvatar />
      <CardTitle>Çay</CardTitle>
      <p>100$</p>
      <Button>Sepete Ekle</Button>
    </Card>
  );
};

export default ItemCard;
