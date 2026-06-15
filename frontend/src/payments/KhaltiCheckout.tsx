import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL || 'http://localhost:8000';

interface KhaltiCheckoutProps {
  orderId: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function KhaltiCheckout({ orderId, onSuccess, onError }: KhaltiCheckoutProps) {
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
      const response = await fetch(`${BASEURL}/api/payment/${orderId}/khalti/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initiate Khalti payment');
      }

      const data = await response.json();

      if (data.payment_url) {
        window.location.href = data.payment_url;
        onSuccess?.();
      } else {
        throw new Error('No payment URL received from Khalti');
      }
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
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium rounded transition disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Processing...' : `Pay with Khalti`}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}