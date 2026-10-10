'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Tag, Plus, AlertCircle, Loader2, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createCouponAction, getInstructorCouponsAction } from '@/actions/coupon-actions';

interface CourseOption {
  _id: string;
  title: string;
}

interface CouponProps {
  _id: string;
  code: string;
  discountPercentage: number;
  courseId: { _id: string; title: string } | null;
  validUntil: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
}

export function InstructorCouponDashboard({ instructorCourses }: { instructorCourses: CourseOption[] }) {
  const [coupons, setCoupons] = useState<CouponProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);
  const [courseId, setCourseId] = useState<string>(''); // empty means All Courses
  const [validUntil, setValidUntil] = useState('');
  const [maxUses, setMaxUses] = useState(100);
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    const res = await getInstructorCouponsAction();
    if (res.success && res.coupons) {
      setCoupons(res.coupons);
    }
    setIsLoading(false);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || !validUntil) {
      setError('Please fill in all required fields.');
      return;
    }

    startTransition(async () => {
      const res = await createCouponAction({
        code,
        discountPercentage: discount,
        courseId: courseId || null,
        validUntil: new Date(validUntil),
        maxUses
      });

      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        // Reset form
        setCode('');
        setDiscount(10);
        setCourseId('');
        setMaxUses(100);
        setValidUntil('');
        // Refresh list
        fetchCoupons();
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Create Coupon Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary-600" />
            Create New Promo Code
          </CardTitle>
          <CardDescription>Generate discount coupons for your students</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Coupon Code *</label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EID50, SUMMER20"
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Percentage (%) *</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100"
                  value={discount} 
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Course (Optional)</label>
                <select 
                  value={courseId} 
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm bg-white"
                >
                  <option value="">Apply to all my courses</option>
                  {instructorCourses.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Valid Until *</label>
                <input 
                  type="date" 
                  value={validUntil} 
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Maximum Uses</label>
                <input 
                  type="number" 
                  min="1" 
                  value={maxUses} 
                  onChange={(e) => setMaxUses(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm"
                />
                <p className="text-xs text-gray-500">How many times can this coupon be claimed in total?</p>
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="mt-4">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
              Generate Coupon
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gray-700" />
            Your Coupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              No coupons created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Usage</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} className="border-b">
                      <td className="px-4 py-3 font-semibold text-gray-900">{coupon.code}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{coupon.discountPercentage}% OFF</td>
                      <td className="px-4 py-3 text-gray-600">
                        {coupon.courseId ? coupon.courseId.title : 'All Courses'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span>{coupon.currentUses} / {coupon.maxUses}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{new Date(coupon.validUntil).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {coupon.isActive && new Date(coupon.validUntil) > new Date() && coupon.currentUses < coupon.maxUses ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Expired/Maxed</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
