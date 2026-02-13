import { ClipLoader } from "react-spinners";

type Props = {
  size?: number;
  text?: string;
};

export default function Spinner({ size, text }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <ClipLoader size={size} color="#0071c2" />
      <p className="text-sm font-medium text-blue-600">{text}</p>
    </div>
  );
}
