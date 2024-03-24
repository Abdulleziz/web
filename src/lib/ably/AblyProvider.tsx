import dynamic from "next/dynamic";

const AblyProvider = dynamic(() => import("./_AblyProvider"), {
  ssr: false,
});

export default AblyProvider;
