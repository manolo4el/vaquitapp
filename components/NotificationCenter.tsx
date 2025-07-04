// components/NotificationCenter.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth"; // o el hook que uses para user

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "notifications", user.uid, "items");
    const q = query(ref, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsSeen = async (notificationId: string) => {
    if (!user) return;
    const ref = doc(db, "notifications", user.uid, "items", notificationId);
    await updateDoc(ref, { seen: true });
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-md mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-4">Notificaciones</h2>
      {notifications.length === 0 && (
        <p className="text-gray-500 text-sm">No tenés notificaciones por ahora.</p>
      )}
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`border-b py-2 ${!n.seen ? "bg-yellow-50" : ""}`}
        >
          <p className="text-sm mb-1">
            {n.actorName} {n.type === "new_expense" && "agregó un gasto en"}{" "}
            {n.type === "new_group" && "te agregó al grupo"}{" "}
            <strong>{n.groupName}</strong>
          </p>
          <p className="text-xs text-gray-500 mb-1">
            {new Date(n.timestamp?.toDate?.()).toLocaleString()}
          </p>
          {!n.seen && (
            <button
              onClick={() => markAsSeen(n.id)}
              className="text-xs text-blue-600"
            >
              Marcar como leída
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
