import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, CreditCard } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

const paymentSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Please enter a valid amount greater than 0",
    }),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
});

type PaymentForm = z.infer<typeof paymentSchema>;

// Payment method options
const paymentMethods = [
  { id: "Bank Transfer", name: "Bank Transfer" },
  { id: "Cash", name: "Cash" },
  { id: "Check", name: "Check" },
];

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentForm) => void;
  projectTitle?: string;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  projectTitle,
}: RecordPaymentModalProps) {
  const [paymentMethodDropdownOpen, setPaymentMethodDropdownOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    trigger,
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    // Remove default values so the form resets properly
  });

  const handlePaymentMethodSelect = async (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setValue('paymentMethod', methodId);
    setPaymentMethodDropdownOpen(false);
    await trigger('paymentMethod');
  };

  const handleFormSubmit = async (data: PaymentForm) => {
    try {
      // Convert amount string to number
      const paymentData = {
        ...data,
        amount: Number(data.amount),
      };
      await onSubmit(paymentData);
      reset();
      onClose();
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedPaymentMethod(null);
    setPaymentMethodDropdownOpen(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Payment">
      {/* Scrollable content area */}
      <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4 p-6"
        >
        

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                {...register("amount")}
                type="number"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-3 py-2 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-400">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="paymentDate"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Payment Date
            </label>
            <input
              {...register("paymentDate")}
              type="date"
              className="w-full px-3 py-2 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-60"
            />
            {errors.paymentDate && (
              <p className="mt-1 text-sm text-red-400">
                {errors.paymentDate.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Payment Method
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPaymentMethodDropdownOpen(!paymentMethodDropdownOpen)}
                className={`w-full px-3 py-2 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  selectedPaymentMethod ? 'text-white' : 'text-gray-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    {selectedPaymentMethod ? (
                      <span className="text-white">{selectedPaymentMethod}</span>
                    ) : (
                      <span>Select payment method...</span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                  paymentMethodDropdownOpen ? 'transform rotate-180' : ''
                }`} />
              </button>

              {paymentMethodDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-700 focus:outline-none border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handlePaymentMethodSelect(method.id)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-800 focus:bg-gray-800 focus:outline-none transition-colors text-white"
                    >
                      {method.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.paymentMethod && (
              <p className="mt-2 text-sm text-red-400">
                {errors.paymentMethod.message}
              </p>
            )}
          </div>

          <div className="flex space-x-3 pt-2 flex-shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
              onClick={handleSubmit(handleFormSubmit)}
            >
              {isSubmitting ? "Recording Payment..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}