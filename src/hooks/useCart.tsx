import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const productExist = cart.find(productCart => productCart.id === productId)

      const productStock = await api.get<Stock>(`/stock/${productId}`)

      const currentAmount = productExist ? productExist.amount : 0

      if (currentAmount + 1 > productStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if (!productExist) {
        const product = await api.get(`/products/${productId}`)
        const newCart = [...cart, { ...product.data, amount: 1 }]

        setCart(newCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))


        return
      }
      else {
        const cartUpdated = cart.map(product => {
          if (product.id === productId) {
            product.amount += 1

            return product
          }

          return product
        })

        setCart(cartUpdated)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))
      }

    }
    catch (err) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const productExist = cart.findIndex(product => product.id === productId)
      if (productExist < 0) {

        throw new Error

      } else {
        const cartUpdated = cart.filter(product => product.id !== productId)

        setCart(cartUpdated)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`)
      if (amount <= 0) {
        return
      }

      if (amount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const cartUpdated = cart.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            amount
          }
        }
        return product
      })
      setCart(cartUpdated)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
