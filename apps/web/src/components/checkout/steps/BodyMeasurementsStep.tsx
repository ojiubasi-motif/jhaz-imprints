/**
 * Body Measurements Step — collect customer body dimensions.
 * Features interactive BodyDiagram with clickable regions that focus corresponding inputs.
 * Allows selecting an existing profile or creating a new one.
 */

"use client";

import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import type { OrderCreate } from "@jhaz-imprints/shared";
import BodyDiagram from "../../BodyDiagram";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMyMeasurements, createMeasurement } from "@/store/slices/measurementsSlice";

type MeasurementField = "chest" | "waist" | "hip" | "shoulder" | "armLength" | "length";

const FIELDS: Array<{
  key: MeasurementField;
  label: string;
  hint: string;
}> = [
  { key: "chest", label: "Bust / Chest", hint: "Fullest part of your chest" },
  { key: "waist", label: "Waist", hint: "Narrowest part of your waist" },
  { key: "hip", label: "Hip", hint: "Fullest part of your hips" },
  { key: "shoulder", label: "Shoulder", hint: "From shoulder to shoulder" },
  { key: "armLength", label: "Arm Length", hint: "From shoulder to wrist" },
  { key: "length", label: "Length", hint: "Full length of garment (shoulder to hem)" },
];

export default function BodyMeasurementsStep() {
  const { register, formState: { errors }, setFocus, setValue, watch, getValues } = useFormContext<any>();
  const [highlightedPart, setHighlightedPart] = useState<MeasurementField | null>(null);
  
  const dispatch = useAppDispatch();
  const { items: profiles, isLoading, isCreating } = useAppSelector((state) => state.measurements);
  
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [profileName, setProfileName] = useState("");
  const selectedMeasurementId = watch("measurementId");

  useEffect(() => {
    dispatch(fetchMyMeasurements());
  }, [dispatch]);

  // If profiles load and none are selected, but we have some, select the first one or default
  useEffect(() => {
    if (profiles.length > 0 && !selectedMeasurementId && !isCreatingNew) {
      const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
      setValue("measurementId", defaultProfile.id);
    } else if (profiles.length === 0 && !isLoading) {
      setIsCreatingNew(true);
    }
  }, [profiles, isLoading, selectedMeasurementId, isCreatingNew, setValue]);

  const handleDiagramClick = (part: MeasurementField) => {
    setHighlightedPart(part);
    setFocus(part);
  };

  const handleInputFocus = (field: MeasurementField) => {
    setHighlightedPart(field);
  };

  const handleInputBlur = () => {
    setHighlightedPart(null);
  };

  const handleCreateProfile = async () => {
    if (!profileName.trim()) {
      alert("Please enter a profile name.");
      return;
    }
    
    const values = getValues();
    const measurementData = {
      profileName,
      isDefault: profiles.length === 0, // Make it default if it's their first profile
      chest: values.chest,
      waist: values.waist,
      hip: values.hip,
      shoulder: values.shoulder,
      armLength: values.armLength,
      length: values.length,
    };

    const resultAction = await dispatch(createMeasurement(measurementData));
    if (createMeasurement.fulfilled.match(resultAction)) {
      setValue("measurementId", resultAction.payload.id);
      setIsCreatingNew(false);
      setProfileName("");
    } else {
      alert("Failed to create profile: " + resultAction.payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Selection */}
      {!isCreatingNew && profiles.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Select Measurement Profile</h3>
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="text-sm text-primary font-medium hover:underline"
            >
              + Create New Profile
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => setValue("measurementId", profile.id)}
                className={`cursor-pointer border rounded-lg p-4 transition-colors ${
                  selectedMeasurementId === profile.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-gray-200 hover:border-primary/50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">{profile.profileName}</h4>
                  {profile.isDefault && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-2 truncate">
                  Chest: {profile.chest}cm, Waist: {profile.waist}cm...
                </p>
              </div>
            ))}
          </div>
          
          {!selectedMeasurementId && (
            <p className="text-sm text-amber-600 mt-2 italic">
              Please select a measurement profile to enable the next step.
            </p>
          )}

          {/* Validation error for missing measurement ID */}
          {errors.measurementId && (
            <p role="alert" className="text-sm text-error mt-1">
              Please select a measurement profile.
            </p>
          )}
        </div>
      )}

      {/* New Profile Form */}
      {isCreatingNew && (
        <div className="space-y-6 border rounded-lg p-6 bg-white">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <h3 className="text-lg font-semibold">Create New Measurement Profile</h3>
            {profiles.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-sm text-muted hover:text-gray-900"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="profileName" className="block text-sm font-medium mb-1">
              Profile Name (e.g. "My Wedding Suit")
            </label>
            <input
              id="profileName"
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Profile Name"
              className="input w-full md:w-1/2"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left: Measurements Form */}
            <div className="space-y-4">
              <h4 className="font-medium">Body Measurements (in cm)</h4>

              {FIELDS.map((field) => (
                <div key={field.key}>
                  <label htmlFor={field.key} className="block text-sm font-medium mb-1">
                    {field.label}
                    <span className="text-xs text-muted ml-1">— {field.hint}</span>
                  </label>
                  <input
                    id={field.key}
                    type="number"
                    min="30"
                    max="250"
                    step="0.5"
                    placeholder="0"
                    {...register(field.key, { valueAsNumber: true })}
                    onFocus={() => handleInputFocus(field.key)}
                    onBlur={handleInputBlur}
                    className={`input w-full transition-colors ${
                      highlightedPart === field.key ? "ring-2 ring-yellow-400 bg-yellow-50" : ""
                    }`}
                  />
                  {(errors as any)[field.key] && (
                    <p role="alert" className="text-sm text-error mt-1">
                      {(errors as any)[field.key]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Right: Body Diagram */}
            <div className="flex flex-col items-center justify-center">
              <BodyDiagram highlightedPart={highlightedPart} onRegionClick={handleDiagramClick} />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
             <button
                type="button"
                onClick={handleCreateProfile}
                disabled={isCreating}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                {isCreating ? "Saving..." : "Save Profile & Select"}
              </button>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-blue-50 p-4 mt-6">
        <p className="text-sm text-gray-700">
          💡 <strong>Tip:</strong> Click any body part in the diagram or input field to focus that measurement. Measure over your normal clothing using a soft measuring tape kept snug but not tight.
        </p>
      </div>
    </div>
  );
}
