import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';

interface EsewaCheckoutProps {
  orderId: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function EsewaCheckout({ orderId, onSuccess, onError }: EsewaCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASEURL}/api/payment/${orderId}/esewa/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initiate eSewa payment');
      }

      const data = await response.json();

      // Create hidden form and submit to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
      form.style.display = 'none';

      const fields: Record<string, string | number> = {
        amount: data.amount,
        tax_amount: data.tax_amount,
        total_amount: data.total_amount,
        transaction_uuid: data.transaction_uuid,
        product_code: data.product_code,
        product_service_charge: data.product_service_charge,
        product_delivery_charge: data.product_delivery_charge,
        success_url: data.success_url,
        failure_url: data.failure_url,
        signed_field_names: data.signed_field_name,
        signature: data.signature,
      };

      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();

      onSuccess?.();
    } catch (err: any) {
      const msg = err.message || 'Payment initiation failed';
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Esewa Checkout</h2>
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded transition disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Processing...' : `Pay with eSewa`}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}