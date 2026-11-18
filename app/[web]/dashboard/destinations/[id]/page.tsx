import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DestinationForm } from "../destination-form";

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string; web: string }>;
}) {
  const { id } = await params;
  const destination = await db.getDestinationById(id);
  if (!destination) {
    notFound();
  }

  const creator = await db.getUserById(destination.createdById);
  const updater = await db.getUserById(destination.updatedById);
  const publisher = destination.publishedById
    ? await db.getUserById(destination.publishedById)
    : null;

  const attribution = {
    createdByName: creator?.name || "Pengguna Terdaftar",
    createdByAvatar: creator?.avatarUrl,
    createdAt: destination.createdAt,
    updatedByName: updater?.name || "Pengguna Terdaftar",
    updatedByAvatar: updater?.avatarUrl,
    updatedAt: destination.updatedAt,
    publishedByName: publisher?.name,
    publishedByAvatar: publisher?.avatarUrl,
    publishedAt: destination.publishedAt,
  };

  return <DestinationForm initialData={destination} attribution={attribution} />;
}
