import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
export const EmptyState = ({ title, description, button, onButtonClick }) => {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Wallet className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {button && (
        <Button onClick={onButtonClick} className="bg-blue-500 hover:bg-blue-600 text-white">
          {button}
        </Button>
      )}
    </div>
  );
}


export const LoaderPlaceholder =({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-16"></div>
      ))}
    </div>
  );
}

