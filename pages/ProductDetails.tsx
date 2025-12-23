import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import apiClient from '../services/apiClient';
import toast from 'react-hot-toast';
import { Product } from '../types';
import useProductReviews from '../hooks/useProductReviews';
import Modal from '../components/ui/Modal';
import { createReport } from '../services/api/reports';
import { useAuth } from '../context/AuthContext';

const ProductDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getProduct(id as any);
        if (mounted) setProduct(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load product');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProduct();
    return () => { mounted = false; };
  }, [id]);

  // Reviews hook
  const { data: reviews, loading: reviewsLoading, createItem: createReview, deleteItem: deleteReview, opState: reviewsOpState, fetch: fetchReviews } = useProductReviews(id as any);

  if (loading) return <Layout><div className="p-8 text-white">Loading...</div></Layout>;
  if (!product) return <Layout><div className="p-8 text-white">Product not found</div></Layout>;

  const seller = (product as any).seller && typeof (product as any).seller === 'object' ? (product as any).seller : {
    id: product.seller,
    name: product.seller_name || 'Owner',
    email: (product as any).seller_email || '',
    phone: (product as any).seller_phone || '',
    first_name: product.seller_name || 'Owner',
  };

  const handleChat = () => {
    // navigate to chat page with query params
    const params = new URLSearchParams();
    if (seller.id) params.set('seller', String(seller.id));
    if (seller.name) params.set('seller_name', String(seller.name));
    params.set('product', String(product.id));
    navigate(`/chat?${params.toString()}`);
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('You must be logged in to post a review');
    try {
      await createReview({ product: product?.id, rating: reviewRating, comment: reviewComment });
      toast.success('Review posted');
      setReviewComment('');
      setReviewRating(5);
      fetchReviews();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to post review');
    }
  };

  const handleDeleteReview = async (rid: number) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(rid);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    try {
      await createReport({ product: product.id, reason: reportReason, details: reportDetails });
      toast.success('Report submitted');
      setIsReportOpen(false);
      setReportReason('');
      setReportDetails('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to submit report');
    }
  };

  

  return (
    <Layout>
      <div className="p-6">
        <div className="flex gap-6 flex-wrap">
          <div className="w-full lg:w-1/3">
            <div className="h-64 w-full bg-center bg-cover rounded-lg" style={{ backgroundImage: `url(${product.image || (product.images && product.images[0]) || ''})` }} />
            {product.images && product.images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {product.images.map((img, i) => (
                  <div key={i} className="h-16 bg-center bg-cover rounded" style={{ backgroundImage: `url(${img})` }} />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{product.title}</h1>
            <p className="text-sm text-white/60 mb-2">{product.category_name}</p>
            <p className="text-white/80 mb-4">{product.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-white/80">Condition: <span className="text-white">{product.condition}</span></div>
              <div className="text-white/80">University: <span className="text-white">{product.university || '-'}</span></div>
              <div className="text-white/80">Faculty: <span className="text-white">{product.faculty || '-'}</span></div>
              <div className="text-white/80">Featured: <span className="text-white">{product.is_featured ? 'Yes' : 'No'}</span></div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="text-3xl font-bold text-white">${product.price}</div>
              <button onClick={handleChat} className="bg-primary text-[#112120] rounded px-4 py-2 font-bold">Chat with owner</button>
            </div>

            <div className="mt-6 p-4 rounded bg-white/5 border border-white/10">
              <h3 className="text-white font-semibold mb-2">Owner Contact</h3>
              <p className="text-white/80">Name: {seller.first_name || seller.name || 'Owner'}</p>
              <p className="text-white/80">Phone: {seller.phone || '-'}</p>
              <p className="text-white/80">Email: {seller.email || '-'}</p>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Reviews</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsReportOpen(true)} className="text-sm text-red-400 hover:underline">Report this product</button>
          </div>
        </div>

        <div className="bg-white/5 rounded p-4 mb-4">
          {reviewsLoading ? (
            <div className="text-white/50">Loading reviews...</div>
          ) : reviews && reviews.length === 0 ? (
            <div className="text-white/50">No reviews yet.</div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="border-b border-white/10 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{r.user_name || `User ${r.user}`}</div>
                      <div className="text-sm text-white/60">{(function formatDate(val:any){ if(!val && val!==0) return ''; try{ const d = typeof val==='number'? new Date(val): new Date(String(val)); if(isNaN(d.getTime())) return String(val); return d.toLocaleString(); }catch(e){ return String(val);} })(r.created_at)}</div>
                  </div>
                  <div className="text-yellow-400 font-semibold">{'★'.repeat(Math.max(0, Math.min(5, r.rating)))}</div>
                </div>
                {r.comment && <div className="mt-2 text-white/80">{r.comment}</div>}
                <div className="mt-2 flex gap-2">
                  {(user && (user.role === 'admin' || user.id === r.user)) && (
                    <button onClick={() => handleDeleteReview(r.id)} className="text-sm text-red-400">Delete</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white/5 p-4 rounded">
          <h4 className="text-white font-semibold mb-2">Leave a review</h4>
          <form onSubmit={handleCreateReview} className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-white/70">Rating</label>
              <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="bg-black/20 text-white p-2 rounded">
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Terrible</option>
              </select>
            </div>
            <div>
              <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Write your review..." className="w-full bg-black/20 p-2 rounded text-white h-24" />
            </div>
            <div className="flex gap-2">
              <button disabled={!user} type="submit" className="bg-primary text-[#112120] px-4 py-2 rounded font-bold">Post Review</button>
              {!user && <div className="text-white/60 text-sm">You must be logged in to post a review.</div>}
            </div>
          </form>
        </div>

      </div>

      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title="Report this product">
        <form onSubmit={handleSubmitReport} className="space-y-3">
          <div>
            <label className="text-sm text-white/80">Reason</label>
            <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full bg-black/20 p-2 rounded text-white">
              <option value="">Select reason</option>
              <option value="spam">Spam or scam</option>
              <option value="fraud">Fraudulent listing</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-white/80">Details</label>
            <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} className="w-full bg-black/20 p-2 rounded text-white h-28" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-primary text-[#112120] px-4 py-2 rounded font-bold">Send Report</button>
            <button type="button" onClick={() => setIsReportOpen(false)} className="px-4 py-2 rounded border border-white/10 text-white">Cancel</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ProductDetails;
