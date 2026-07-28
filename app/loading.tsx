import Loader from "@/components/common/Loader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <Loader text="Loading LOOP AI Intelligence..." />
    </div>
  );
}
