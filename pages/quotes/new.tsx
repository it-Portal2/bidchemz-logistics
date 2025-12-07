import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { FormSection } from '@/components/forms/FormSection';
import { FormField } from '@/components/forms/FormField';
import { CheckboxGroup } from '@/components/forms/CheckboxGroup';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { PackagingType, VehicleType, HazardClass } from '@prisma/client';

export default function NewQuote() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cargoName: '',
    casNumber: '',
    quantity: '',
    quantityUnit: 'MT',
    isHazardous: false,
    hazardClass: '',
    unNumber: '',
    cargoReadyDate: '',
    estimatedDeliveryDate: '',
    pickupAddress: '',
    pickupCity: '',
    pickupState: '',
    pickupPincode: '',
    pickupCountry: 'India',
    pickupContactName: '',
    pickupContactPhone: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPincode: '',
    deliveryCountry: 'India',
    deliveryContactName: '',
    deliveryContactPhone: '',
    packagingType: '',
    packagingDetails: '',
    specialHandling: '',
    temperatureControlled: false,
    temperatureMin: '',
    temperatureMax: '',
    preferredVehicleType: [] as string[],
    vehicleSpecifications: '',
    insuranceRequired: false,
    insuranceValue: '',
    msdsRequired: false,
    paymentTerms: '',
    billingAddress: '',
    additionalNotes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxGroupChange = (name: string, values: string[]) => {
    setFormData(prev => ({ ...prev, [name]: values }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cargoName) newErrors.cargoName = 'Cargo name is required';
    if (!formData.quantity) newErrors.quantity = 'Quantity is required';
    if (!formData.quantityUnit) newErrors.quantityUnit = 'Quantity unit is required';
    if (!formData.cargoReadyDate) newErrors.cargoReadyDate = 'Cargo ready date is required';
    if (!formData.pickupAddress) newErrors.pickupAddress = 'Pickup address is required';
    if (!formData.pickupCity) newErrors.pickupCity = 'Pickup city is required';
    if (!formData.pickupState) newErrors.pickupState = 'Pickup state is required';
    if (!formData.pickupPincode) newErrors.pickupPincode = 'Pickup pincode is required';
    if (!formData.deliveryAddress) newErrors.deliveryAddress = 'Delivery address is required';
    if (!formData.deliveryCity) newErrors.deliveryCity = 'Delivery city is required';
    if (!formData.deliveryState) newErrors.deliveryState = 'Delivery state is required';
    if (!formData.deliveryPincode) newErrors.deliveryPincode = 'Delivery pincode is required';
    if (!formData.packagingType) newErrors.packagingType = 'Packaging type is required';
    if (formData.isHazardous && !formData.hazardClass) {
      newErrors.hazardClass = 'Hazard class is required for hazardous cargo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity),
          temperatureMin: formData.temperatureMin ? parseFloat(formData.temperatureMin) : null,
          temperatureMax: formData.temperatureMax ? parseFloat(formData.temperatureMax) : null,
          insuranceValue: formData.insuranceValue ? parseFloat(formData.insuranceValue) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create quote');
      }

      router.push(`/quotes/${data.quote.id}`);
    } catch (error) {
      console.error('Error creating quote:', error);
      alert(error instanceof Error ? error.message : 'Failed to create quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Please log in to create a freight request</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">New Freight Request</h1>

        <form onSubmit={handleSubmit}>
          <FormSection
            title="1. Shipment Information"
            description="Basic details about your cargo"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Cargo Name"
                name="cargoName"
                value={formData.cargoName}
                onChange={handleChange}
                error={errors.cargoName}
                required
                placeholder="e.g., Sulfuric Acid"
              />
              <FormField
                label="CAS Number"
                name="casNumber"
                value={formData.casNumber}
                onChange={handleChange}
                placeholder="e.g., 7664-93-9"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={errors.quantity}
                required
                min="0"
                step="0.01"
              />
              <FormField
                label="Unit"
                name="quantityUnit"
                type="select"
                value={formData.quantityUnit}
                onChange={handleChange}
                options={[
                  { label: 'MT (Metric Ton)', value: 'MT' },
                  { label: 'KG (Kilogram)', value: 'KG' },
                  { label: 'Litre', value: 'Litre' },
                ]}
                required
              />
              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="isHazardous"
                  name="isHazardous"
                  checked={formData.isHazardous}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isHazardous" className="ml-2 text-sm text-gray-700">
                  Hazardous Cargo
                </label>
              </div>
            </div>

            {formData.isHazardous && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Hazard Class"
                  name="hazardClass"
                  type="select"
                  value={formData.hazardClass}
                  onChange={handleChange}
                  error={errors.hazardClass}
                  options={Object.values(HazardClass).map(hc => ({
                    label: hc.replace('_', ' '),
                    value: hc,
                  }))}
                  required
                />
                <FormField
                  label="UN Number"
                  name="unNumber"
                  value={formData.unNumber}
                  onChange={handleChange}
                  placeholder="e.g., UN1830"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Cargo Ready Date"
                name="cargoReadyDate"
                type="datetime-local"
                value={formData.cargoReadyDate}
                onChange={handleChange}
                error={errors.cargoReadyDate}
                required
              />
              <FormField
                label="Estimated Delivery Date"
                name="estimatedDeliveryDate"
                type="datetime-local"
                value={formData.estimatedDeliveryDate}
                onChange={handleChange}
              />
            </div>
          </FormSection>

          <FormSection
            title="2. Pickup Location"
            description="Where should the cargo be collected?"
          >
            <FormField
              label="Address"
              name="pickupAddress"
              type="textarea"
              value={formData.pickupAddress}
              onChange={handleChange}
              error={errors.pickupAddress}
              required
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="City"
                name="pickupCity"
                value={formData.pickupCity}
                onChange={handleChange}
                error={errors.pickupCity}
                required
              />
              <FormField
                label="State"
                name="pickupState"
                value={formData.pickupState}
                onChange={handleChange}
                error={errors.pickupState}
                required
              />
              <FormField
                label="Pincode"
                name="pickupPincode"
                value={formData.pickupPincode}
                onChange={handleChange}
                error={errors.pickupPincode}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Contact Name"
                name="pickupContactName"
                value={formData.pickupContactName}
                onChange={handleChange}
              />
              <FormField
                label="Contact Phone"
                name="pickupContactPhone"
                type="text"
                value={formData.pickupContactPhone}
                onChange={handleChange}
              />
            </div>
          </FormSection>

          <FormSection
            title="3. Delivery Location"
            description="Where should the cargo be delivered?"
          >
            <FormField
              label="Address"
              name="deliveryAddress"
              type="textarea"
              value={formData.deliveryAddress}
              onChange={handleChange}
              error={errors.deliveryAddress}
              required
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="City"
                name="deliveryCity"
                value={formData.deliveryCity}
                onChange={handleChange}
                error={errors.deliveryCity}
                required
              />
              <FormField
                label="State"
                name="deliveryState"
                value={formData.deliveryState}
                onChange={handleChange}
                error={errors.deliveryState}
                required
              />
              <FormField
                label="Pincode"
                name="deliveryPincode"
                value={formData.deliveryPincode}
                onChange={handleChange}
                error={errors.deliveryPincode}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Contact Name"
                name="deliveryContactName"
                value={formData.deliveryContactName}
                onChange={handleChange}
              />
              <FormField
                label="Contact Phone"
                name="deliveryContactPhone"
                type="text"
                value={formData.deliveryContactPhone}
                onChange={handleChange}
              />
            </div>
          </FormSection>

          <FormSection
            title="4. Handling Requirements"
            description="Packaging and special handling needs"
          >
            <FormField
              label="Packaging Type"
              name="packagingType"
              type="select"
              value={formData.packagingType}
              onChange={handleChange}
              error={errors.packagingType}
              options={Object.values(PackagingType).map(pt => ({
                label: pt.replace('_', ' '),
                value: pt,
              }))}
              required
            />
            <FormField
              label="Packaging Details"
              name="packagingDetails"
              type="textarea"
              value={formData.packagingDetails}
              onChange={handleChange}
              placeholder="Describe any specific packaging requirements"
            />
            <FormField
              label="Special Handling Instructions"
              name="specialHandling"
              type="textarea"
              value={formData.specialHandling}
              onChange={handleChange}
              placeholder="Any special handling requirements"
            />

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="temperatureControlled"
                name="temperatureControlled"
                checked={formData.temperatureControlled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="temperatureControlled" className="ml-2 text-sm text-gray-700">
                Temperature Controlled
              </label>
            </div>

            {formData.temperatureControlled && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Min Temperature (°C)"
                  name="temperatureMin"
                  type="number"
                  value={formData.temperatureMin}
                  onChange={handleChange}
                  step="0.1"
                />
                <FormField
                  label="Max Temperature (°C)"
                  name="temperatureMax"
                  type="number"
                  value={formData.temperatureMax}
                  onChange={handleChange}
                  step="0.1"
                />
              </div>
            )}
          </FormSection>

          <FormSection
            title="5. Vehicle Requirements"
            description="Preferred vehicle types for transportation"
          >
            <CheckboxGroup
              label="Preferred Vehicle Types"
              name="preferredVehicleType"
              value={formData.preferredVehicleType}
              onChange={(values) => handleCheckboxGroupChange('preferredVehicleType', values)}
              options={Object.values(VehicleType).map(vt => ({
                label: vt.replace('_', ' '),
                value: vt,
              }))}
            />
            <FormField
              label="Vehicle Specifications"
              name="vehicleSpecifications"
              type="textarea"
              value={formData.vehicleSpecifications}
              onChange={handleChange}
              placeholder="Any specific vehicle requirements or specifications"
            />
          </FormSection>

          <FormSection
            title="6. Insurance & Compliance"
            description="Insurance and documentation requirements"
          >
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="insuranceRequired"
                  name="insuranceRequired"
                  checked={formData.insuranceRequired}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="insuranceRequired" className="ml-2 text-sm text-gray-700">
                  Insurance Required
                </label>
              </div>

              {formData.insuranceRequired && (
                <FormField
                  label="Insurance Value (INR)"
                  name="insuranceValue"
                  type="number"
                  value={formData.insuranceValue}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="msdsRequired"
                  name="msdsRequired"
                  checked={formData.msdsRequired}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="msdsRequired" className="ml-2 text-sm text-gray-700">
                  MSDS/SDS Required
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection
            title="7. Billing & Payment"
            description="Payment terms and billing information"
          >
            <FormField
              label="Payment Terms"
              name="paymentTerms"
              type="textarea"
              value={formData.paymentTerms}
              onChange={handleChange}
              placeholder="e.g., Net 30, Advance payment, etc."
            />
            <FormField
              label="Billing Address"
              name="billingAddress"
              type="textarea"
              value={formData.billingAddress}
              onChange={handleChange}
              placeholder="If different from pickup/delivery address"
            />
          </FormSection>

          <FormSection
            title="8. Additional Notes"
            description="Any other information you'd like to share"
          >
            <FormField
              label="Notes"
              name="additionalNotes"
              type="textarea"
              value={formData.additionalNotes}
              onChange={handleChange}
              placeholder="Any additional requirements or information"
            />
          </FormSection>

          <div className="flex justify-end space-x-4 mt-8">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Freight Request'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
