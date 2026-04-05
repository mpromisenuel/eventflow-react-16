import { useState } from "react";
import { useEvents } from "@/context/EventContext";
import { useAuth } from "@/context/AuthContext";
import { Star, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { reviewSchema } from "@/lib/validations";

interface ReviewSectionProps {
  venueId: string;
}

const ReviewSection = ({ venueId }: ReviewSectionProps) => {
  const { getReviewsForVenue, addReview, hasReviewed } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();
  const reviews = getReviewsForVenue(venueId);
  const alreadyReviewed = hasReviewed(venueId);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    setErrors({});
    const result = reviewSchema.safeParse({ rating, comment: comment || undefined });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const success = await addReview(venueId, rating, comment);
    setSubmitting(false);
    if (success) {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      setRating(0);
      setComment("");
    } else {
      toast({ title: "Failed to submit review", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl p-6 space-y-6"
    >
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" /> Reviews ({reviews.length})
      </h3>

      {user && !alreadyReviewed && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
          <p className="font-body text-sm font-medium">Write a review</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= (hoverRating || rating)
                      ? "fill-gold text-gold"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          {errors.rating && <p className="text-xs text-destructive font-body">{errors.rating}</p>}
          <Textarea
            placeholder="Share your experience with this venue..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={`font-body text-sm ${errors.comment ? "border-destructive" : ""}`}
            rows={3}
            maxLength={1000}
          />
          {errors.comment && <p className="text-xs text-destructive font-body">{errors.comment}</p>}
          <div className="flex items-center justify-between">
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="font-body text-xs"
              size="sm"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
            <span className="text-xs text-muted-foreground font-body">{comment.length}/1000</span>
          </div>
        </div>
      )}

      {alreadyReviewed && (
        <p className="text-sm text-primary font-body">✓ You've already reviewed this venue</p>
      )}

      {!user && (
        <p className="text-sm text-muted-foreground font-body">Sign in to leave a review</p>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${star <= review.rating ? "fill-gold text-gold" : "text-muted-foreground/20"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground font-body">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground font-body ml-9">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground font-body">No reviews yet. Be the first!</p>
      )}
    </motion.div>
  );
};

export default ReviewSection;
