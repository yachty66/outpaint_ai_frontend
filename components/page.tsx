"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Header } from "@/components/header";

interface Generation {
  id: string;
  created_at: string;
  input_image: string;
  output_image: string;
  user_email: string;
}

export default function GenerationsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) return;

    const fetchGenerations = async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("user_email", user.email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching generations:", error);
        return;
      }

      setGenerations(data || []);
    };

    fetchGenerations();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Your Generations</h1>
        
        {generations.length === 0 ? (
          <p className="text-gray-600">No generations yet. Start creating!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generations.map((generation) => (
              <Card key={generation.id} className="overflow-hidden">
                <div className="p-4 space-y-4">
                  <div className="relative aspect-square">
                    <Image
                      src={generation.input_image}
                      alt="Input image"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="relative aspect-square">
                    <Image
                      src={generation.output_image}
                      alt="Generated image"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(generation.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}