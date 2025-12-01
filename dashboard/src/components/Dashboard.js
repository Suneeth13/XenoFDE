import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [metrics, setMetrics] = useState({ totalCustomers: 0, totalOrders: 0, totalRevenue: 0 });
  const [orders, setOrders] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const [products, setProducts] = useState([]);
  const [newOrder, setNewOrder] = useState({
    orderId: '',
    customerName: '',
    orderTime: '',
    amount: '',
    noOfItems: ''
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: new Date().toISOString().split('T')[0]
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsRes, ordersRes, customersRes, productsRes] = await Promise.all([
        axios.get(`https://xenofide-backend-production.up.railway.app/api/metrics?start=${dateRange.start}&end=${dateRange.end}`),
        axios.get(`https://xenofide-backend-production.up.railway.app/api/orders?start=${dateRange.start}&end=${dateRange.end}`),
        axios.get('https://xenofide-backend-production.up.railway.app/api/customers/top'),
        axios.get('https://xenofide-backend-production.up.railway.app/api/products')
      ]);

      setMetrics(metricsRes.data);
      setOrders(ordersRes.data);
      setTopCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [dateRange, fetchData]);

  const revenueChartData = {
    labels: orders.map(order => new Date(order.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Revenue',
        data: orders.map(order => order.totalPrice),
        borderColor: 'rgb(20, 184, 166)',
        backgroundColor: 'rgba(20, 184, 166, 0.5)',
      },
    ],
  };

  const topCustomersChartData = {
    labels: topCustomers.map(customer => customer.email || 'No Email'),
    datasets: [
      {
        label: 'Total Spent',
        data: topCustomers.map(customer => customer.totalSpent),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(newOrder.amount);
    const orderIdNum = parseInt(newOrder.orderId);
    const noOfItemsNum = parseInt(newOrder.noOfItems);
    const orderDate = new Date(newOrder.orderTime);
    // Add to recentOrders
    const newOrderObj = {
      orderId: orderIdNum,
      customerName: newOrder.customerName,
      orderTime: orderDate.toLocaleString(),
      amount: 'Rs.' + amountNum.toFixed(2),
      noOfItems: noOfItemsNum
    };
    setRecentOrders([newOrderObj, ...recentOrders]);
    // Add to orders
    const orderForChart = {
      createdAt: orderDate.toISOString(),
      totalPrice: amountNum
    };
    setOrders([...orders, orderForChart]);
    // Update topCustomers
    const customerIndex = topCustomers.findIndex(c => c.email === newOrder.customerName);
    if (customerIndex >= 0) {
      const updatedCustomers = [...topCustomers];
      updatedCustomers[customerIndex].totalSpent += amountNum;
      setTopCustomers(updatedCustomers);
    } else {
      setTopCustomers([...topCustomers, { email: newOrder.customerName, totalSpent: amountNum }]);
    }
    // Update metrics
    setMetrics({
      totalCustomers: customerIndex < 0 ? metrics.totalCustomers + 1 : metrics.totalCustomers,
      totalOrders: metrics.totalOrders + 1,
      totalRevenue: metrics.totalRevenue + amountNum
    });
    // Reset
    setNewOrder({
      orderId: '',
      customerName: '',
      orderTime: '',
      amount: '',
      noOfItems: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Shopify Insights Dashboard</h1>
            <p className="text-gray-600">Real-time analytics from your Shopify store</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range Filter</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  id="start-date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  id="end-date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-transform duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-blue-100 truncate">Total Customers</dt>
                    <dd className="text-3xl font-bold text-white">{metrics.totalCustomers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-transform duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-green-100 truncate">Total Orders</dt>
                    <dd className="text-3xl font-bold text-white">{metrics.totalOrders}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 overflow-hidden shadow-lg rounded-xl transform hover:scale-105 transition-transform duration-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-purple-100 truncate">Total Revenue</dt>
                    <dd className="text-3xl font-bold text-white">${metrics.totalRevenue.toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <input
              type="number"
              placeholder="Order ID"
              value={newOrder.orderId}
              onChange={(e) => setNewOrder({ ...newOrder, orderId: e.target.value })}
              required
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Customer Name"
              value={newOrder.customerName}
              onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
              required
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="datetime-local"
              placeholder="Order Time"
              value={newOrder.orderTime}
              onChange={(e) => setNewOrder({ ...newOrder, orderTime: e.target.value })}
              required
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={newOrder.amount}
              onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
              required
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="number"
              placeholder="No. of Items"
              value={newOrder.noOfItems}
              onChange={(e) => setNewOrder({ ...newOrder, noOfItems: e.target.value })}
              required
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="md:col-span-5 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add Order
            </button>
          </form>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
ans               <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. of Items</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order, index) => (
                  <tr key={order.orderId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.orderTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.noOfItems}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h2>
            <Line data={revenueChartData} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top 5 Customers by Spend</h2>
            <Bar data={topCustomersChartData} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.slice(0, 10).map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.vendor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rs.{parseFloat(product.variants[0]?.price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
