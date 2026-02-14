"use client";

import { use, useActionState, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { updateProduct, State } from "@/app/produtos/actions";
import ProductForm from "../../components/product-form";
import { useCategories } from "@/app/hooks/use-categories";
import { useProduct } from "@/app/hooks/use-products";
import { useRouter } from "next/navigation";

export default function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch data
  const { data: categories = [] } = useCategories();
  const { data: product, isLoading: loadingProduct } = useProduct(id);

  // Bind the id to the update action
  const updateProductWithId = updateProduct.bind(null, id);
  const initialState: State = { message: null, errors: {} };
  const [state, formAction, isPending] = useActionState(
    updateProductWithId,
    initialState,
  );

  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (product) {
      setInitialData({
        name: product.name,
        description: product.description || "",
        sku: product.sku,
        price: String(product.price),
        quantity: String(product.quantity),
        minStock: String(product.minStock),
        categoryId: product.categoryId,
      });
    }
  }, [product]);

  if (loadingProduct) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "40vh",
          color: "var(--text-muted)",
        }}
      >
        Carregando...
      </div>
    );
  }

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
          Editar Produto
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

        {initialData && (
          <ProductForm
            initialData={initialData}
            categories={categories}
            action={formAction}
            state={state}
            isPending={isPending}
            submitLabel="Salvar Alterações"
            onCancel={() => router.push("/produtos")}
          />
        )}
      </div>
    </div>
  );
}
