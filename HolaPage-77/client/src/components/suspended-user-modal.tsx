import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Ban, Mail } from "lucide-react";

interface SuspendedUserModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SuspendedUserModal({ open, onOpenChange }: SuspendedUserModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Show modal if user is authenticated but suspended
    if (isAuthenticated && user?.isSuspended) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, user]);

  const handleClose = (openState: boolean) => {
    if (!openState) {
      // Log user out when they close the modal
      window.location.href = "/api/logout";
    }
    setShowModal(openState);
    if (onOpenChange) onOpenChange(openState);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleContactSupport = () => {
    const email = "support@tradeflow.com";
    const subject = `Account Suspension Appeal - ${user?.username}`;
    const body = `Hello,

I would like to appeal my account suspension. 

Account Details:
- Username: ${user?.username}
- Email: ${user?.email}
- Suspension Reason: ${user?.suspensionReason || 'Not specified'}

Please review my account status.

Thank you.`;

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  if (!user?.isSuspended) return null;

  return (
    <Dialog open={open !== undefined ? open : showModal} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Ban className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
            Account Suspended
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DialogDescription className="text-center text-base">
            Your account has been temporarily suspended and you cannot access the trading journal at this time.
          </DialogDescription>

          {user.suspensionReason && (
            <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200 text-sm">
                      Suspension Reason
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                      {user.suspensionReason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>
              If you believe this is a mistake or would like to appeal this suspension, 
              please contact our support team.
            </p>
          </div>

          <div className="flex flex-col space-y-3 pt-4">
            <Button
              onClick={handleContactSupport}
              className="w-full"
              variant="outline"
              data-testid="button-contact-support"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            
            <Button
              onClick={handleLogout}
              className="w-full"
              variant="default"
              data-testid="button-logout"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}