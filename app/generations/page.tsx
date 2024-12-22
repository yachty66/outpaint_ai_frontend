"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Header } from "@/components/header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Generation {
  input_image: string;
  output_image: string;
  created_at: string;
}

export default function GenerationsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) return;

    const fetchGenerations = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("generations")
        .eq("email", user.email)
        .single();

      if (error) {
        console.error("Error fetching generations:", error);
        return;
      }

      // Sort generations by created_at in descending order
      const sortedGenerations = (data?.generations || []).sort(
        (a: Generation, b: Generation) => {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      );

      setGenerations(sortedGenerations);
    };

    fetchGenerations();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/"
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </div>

          {generations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No generations yet.</p>
              <Link
                href="/"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Create your first generation
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generations.map((generation, index) => (
                <Card
                  key={index}
                  className="overflow-hidden bg-white hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="space-y-4">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={generation.input_image}
                          alt="Input image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={generation.output_image}
                          alt="Generated image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 pt-2 border-t">
                        <span>
                          {new Date(generation.created_at).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
