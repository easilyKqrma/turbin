import React, { useEffect, useRef, useState } from "react";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

declare global {
  interface Window {
    paypal: any;
  }
}

export default function PayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const [paypalError, setPaypalError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clientId, setClientId] = useState<string>("");

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        // Get client ID from backend first
        const response = await fetch('/paypal/client-id');
        if (!response.ok) {
          throw new Error('Failed to get PayPal client ID');
        }
        const data = await response.json();
        setClientId(data.clientId);

        // Check if PayPal script is already loaded
        if (window.paypal) {
          setIsLoading(false);
          // Delay initialization to ensure DOM is ready
          setTimeout(initializePayPal, 200);
          return;
        }

        // Load PayPal JavaScript SDK with official expanded checkout configuration
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&components=buttons,card-fields&currency=${currency}&enable-funding=venmo,card`;
        script.async = true;
        script.onload = () => {
          setIsLoading(false);
          // Delay initialization to ensure DOM is ready
          setTimeout(initializePayPal, 200);
        };
        script.onerror = () => {
          console.error('Failed to load PayPal SDK');
          setPaypalError(true);
          setIsLoading(false);
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error("Failed to initialize PayPal:", error);
        setPaypalError(true);
        setIsLoading(false);
      }
    };

    // Delay the SDK loading to ensure component is mounted
    const timer = setTimeout(loadPayPalSDK, 100);
    
    return () => clearTimeout(timer);
  }, [amount, currency]);

  const createOrder = async () => {
    try {
      const response = await fetch("/paypal/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          intent: intent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await response.json();
      return orderData.id;
    } catch (error) {
      console.error('Could not initiate PayPal Checkout:', error);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    try {
      const response = await fetch(`/paypal/order/${data.orderID}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error('Failed to capture payment');
      }

      const orderData = await response.json();
      console.log('Capture result', orderData);

      // Show success message
      alert(`Payment completed successfully! Transaction ID: ${orderData.id}`);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Payment capture error:', error);
      alert(`Sorry, your transaction could not be processed: ${error}`);
    }
  };

  const onError = (error: any) => {
    console.error('PayPal SDK Error:', error);
    setPaypalError(true);
  };

  const initializePayPal = () => {
    if (!window.paypal) {
      setTimeout(initializePayPal, 100);
      return;
    }

    // Wait for DOM elements to be available
    const buttonContainer = document.getElementById('paypal-button-container');
    const cardContainer = document.getElementById('card-fields-container');
    
    if (!buttonContainer || !cardContainer) {
      setTimeout(initializePayPal, 100);
      return;
    }

    try {
      // Render PayPal Buttons (official implementation)
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 40
        },
        createOrder: createOrder,
        onApprove: onApprove,
        onError: onError,
        onCancel: (data: any) => {
          console.log('Payment cancelled', data);
        }
      }).render('#paypal-button-container');

      // Render Card Fields only if CardFields is available and eligible
      if (window.paypal.CardFields && typeof window.paypal.CardFields.isEligible === 'function' && window.paypal.CardFields.isEligible()) {
        const cardFields = window.paypal.CardFields({
          createOrder: createOrder,
          onApprove: onApprove,
          onError: onError,
          style: {
            input: {
              'font-size': '16px',
              'font-family': 'Arial, sans-serif',
              color: '#ffffff',
              'background-color': '#374151',
              border: '1px solid #4b5563',
              'border-radius': '6px',
              padding: '12px'
            },
            '.invalid': {
              color: '#ef4444',
              'border-color': '#ef4444'
            }
          }
        });

        // Render individual card fields
        cardFields.NameField().render('#card-name-field-container');
        cardFields.NumberField().render('#card-number-field-container');
        cardFields.ExpiryField().render('#card-expiry-field-container');
        cardFields.CVVField().render('#card-cvv-field-container');

        // Submit button handler
        const submitButton = document.getElementById('card-field-submit-button');
        if (submitButton) {
          submitButton.addEventListener('click', () => {
            cardFields.submit({
              billingAddress: {
                addressLine1: (document.getElementById('card-billing-address-line-1') as HTMLInputElement)?.value || '',
                addressLine2: (document.getElementById('card-billing-address-line-2') as HTMLInputElement)?.value || '',
                adminArea1: (document.getElementById('card-billing-address-admin-area-line-1') as HTMLInputElement)?.value || '',
                adminArea2: (document.getElementById('card-billing-address-admin-area-line-2') as HTMLInputElement)?.value || '',
                countryCode: (document.getElementById('card-billing-address-country-code') as HTMLInputElement)?.value || 'US',
                postalCode: (document.getElementById('card-billing-address-postal-code') as HTMLInputElement)?.value || ''
              }
            }).then(() => {
              console.log('Card payment submitted successfully');
            }).catch((err: any) => {
              console.error('Card payment submission failed:', err);
            });
          });
        }
      } else {
        // Hide card fields if not eligible or CardFields not available
        console.log('Card fields not available or not eligible');
        if (cardContainer) {
          cardContainer.style.display = 'none';
        }
      }

    } catch (error) {
      console.error('Failed to initialize PayPal components:', error);
      setPaypalError(true);
    }
  };

  if (paypalError) {
    return (
      <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-600">
        <div className="text-yellow-400 mb-2">⚠️ PayPal Configuration Issue</div>
        <div className="text-gray-300 text-sm">
          PayPal payment is temporarily unavailable. Please contact support to complete your purchase.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
        <div className="text-gray-400 text-sm">Loading payment options...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* PayPal Button Container */}
      <div>
        <h3 className="text-white font-medium mb-3 text-lg">Pay with PayPal</h3>
        <div id="paypal-button-container"></div>
      </div>

      {/* Card Fields Container */}
      <div id="card-fields-container">
        <h3 className="text-white font-medium mb-3 text-lg">Pay with Credit or Debit Card</h3>
        <div className="space-y-4 p-6 bg-gray-800 rounded-lg border border-gray-600">
          {/* Card Fields */}
          <div className="grid grid-cols-1 gap-4">
            <div id="card-name-field-container"></div>
            <div id="card-number-field-container"></div>
            <div className="grid grid-cols-2 gap-4">
              <div id="card-expiry-field-container"></div>
              <div id="card-cvv-field-container"></div>
            </div>
          </div>

          {/* Billing Address Fields */}
          <div className="space-y-4 mt-6">
            <h4 className="text-white font-medium text-sm">Billing Address</h4>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                id="card-billing-address-line-1"
                name="card-billing-address-line-1"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Address line 1"
                autoComplete="street-address"
              />
              <input
                type="text"
                id="card-billing-address-line-2"
                name="card-billing-address-line-2"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Address line 2 (optional)"
                autoComplete="address-line2"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  id="card-billing-address-admin-area-line-1"
                  name="card-billing-address-admin-area-line-1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City"
                  autoComplete="address-level2"
                />
                <input
                  type="text"
                  id="card-billing-address-admin-area-line-2"
                  name="card-billing-address-admin-area-line-2"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="State"
                  autoComplete="address-level1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  id="card-billing-address-country-code"
                  name="card-billing-address-country-code"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Country (e.g., US)"
                  autoComplete="country"
                  defaultValue="US"
                />
                <input
                  type="text"
                  id="card-billing-address-postal-code"
                  name="card-billing-address-postal-code"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ZIP/Postal code"
                  autoComplete="postal-code"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            id="card-field-submit-button"
            type="button"
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Pay ${amount} with Card
          </button>
        </div>
      </div>
    </div>
  );
}