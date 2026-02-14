"use client";

import { useActionState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createProduct, State } from "@/app/produtos/actions";
import ProductForm from "../components/product-form";
import { useCategories } from "@/app/hooks/use-categories";
import { useRouter } from "next/navigation";

export default function NovoProdutoPage() {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const initialState: State = { message: null, errors: {} };
  const [state, formAction, isPending] = useActionState(
    createProduct,
    initialState,
  );

  return (
    <div style={{ maxWidth: "640px" }}>
      <Link
        href="/produtos"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--text-secondary)",
          fontSize: "13px",
          textDecoration: "none",
          marginBottom: "20px",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--text-primary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-secondary)")
        }
      >
        <ArrowLeft size={16} />
        Voltar para Produtos
      </Link>

      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-color)",
          padding: "28px",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "24px",
          }}
        >
          Novo Produto
        </h2>

        {state?.message && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--accent-danger-bg)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--accent-danger)",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            {state.message}
          </div>
        )}

        <ProductForm
          categories={categories}
          action={formAction}
          state={state}
          isPending={isPending}
          submitLabel="Salvar Produto"
          onCancel={() => router.push("/produtos")}
        />
      </div>
    </div>
  );
}
