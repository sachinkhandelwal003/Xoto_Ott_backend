
import { useGetMe } from "../lib/api-client";
import {
  User,
  Users,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Film,
  Play,
  DollarSign,
  Activity,
  Calendar,
  Star,
  PieChart as PieChartIcon,
  BarChart3,
  Bell,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for charts
const revenueData = [
  { name: 'Jan', value: 15000 },
  { name: 'Feb', value: 12000 },
  { name: 'Mar', value: 18000 },
  { name: 'Apr', value: 25000 },
  { name: 'May', value: 22000 },
  { name: 'Jun', value: 28000 },
  { name: 'Jul', value: 26000 },
];

const newSubscribersData = [
  { name: 'Jan', basic: 120, premium: 80 },
  { name: 'Feb', basic: 132, premium: 95 },
  { name: 'Mar', basic: 101, premium: 88 },
  { name: 'Apr', basic: 134, premium: 110 },
  { name: 'May', basic: 90, premium: 78 },
  { name: 'Jun', basic: 230, premium: 150 },
];

const mostWatchedData = [
  { name: 'Jan', movies: 15, tvShows: 12 },
  { name: 'Feb', movies: 18, tvShows: 15 },
  { name: 'Mar', movies: 22, tvShows: 18 },
  { name: 'Apr', movies: 20, tvShows: 20 },
  { name: 'May', movies: 25, tvShows: 22 },
  { name: 'Jun', movies: 30, tvShows: 28 },
  { name: 'Jul', movies: 28, tvShows: 25 },
];

const topGenresData = [
  { name: 'Horror', value: 25 },
  { name: 'Historical', value: 20 },
  { name: 'Inspirational', value: 18 },
  { name: 'Romantic', value: 22 },
  { name: 'Comedy', value: 15 },
];

const COLORS = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444'];

const reviewsData = [
  {
    name: 'Dorothy Erickson',
    date: '3rd June 2026',
    category: 'TV Shows',
    rating: 5,
    avatar: 'D',
  },
  {
    name: 'Lila Lucas',
    date: '1st June 2026',
    category: 'TV Shows',
    rating: 4,
    avatar: 'L',
  },
  {
    name: 'Tracy Jones',
    date: '31st May 2026',
    category: 'TV Shows',
    rating: 5,
    avatar: 'T',
  },
  {
    name: 'Dorothy Erickson',
    date: '30th May 2026',
    category: 'TV Shows',
    rating: 5,
    avatar: 'D',
  },
  {
    name: 'Tracy Jones',
    date: '29th May 2026',
    category: 'TV Shows',
    rating: 4,
    avatar: 'T',
  },
  {
    name: 'Jay Henry',
    date: '28th May 2026',
    category: 'TV Shows',
    rating: 5,
    avatar: 'J',
  },
];

const transactionsData = [
  {
    name: 'Tristan Erikson',
    date: '2026-05-15',
    plan: 'Basic',
    amount: '₱5.00',
    duration: '1 month',
    method: 'Stripe',
    avatar: 'T',
  },
  {
    name: 'John Doe',
    date: '2026-05-11',
    plan: 'Ultimate Plan',
    amount: '₱50.00',
    duration: '3 months',
    method: 'Stripe',
    avatar: 'J',
  },
  {
    name: 'Lila Lucas',
    date: '2026-05-10',
    plan: 'Premium Plan',
    amount: '₱20.00',
    duration: '1 month',
    method: '-',
    avatar: 'L',
  },
  {
    name: 'Dorothy Erickson',
    date: '-',
    plan: 'Basic',
    amount: '₱5.00',
    duration: '1 month',
    method: '-',
    avatar: 'D',
  },
  {
    name: 'Sinika Green',
    date: '2026-05-06',
    plan: 'Premium Plan',
    amount: '₱20.00',
    duration: '1 month',
    method: 'Stripe',
    avatar: 'S',
  },
  {
    name: 'Fefe Harris',
    date: '2026-05-08',
    plan: 'Premium Plan',
    amount: '₱20.00',
    duration: '1 month',
    method: '-',
    avatar: 'F',
  },
];

export default function Dashboard() {
  const { data: user } = useGetMe();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const stats = [
    {
      title: "Total Users",
      value: "13",
      icon: Users,
      iconBg: "from-red-600 to-red-700",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Total Subscribers",
      value: "8",
      icon: Users,
      iconBg: "from-red-600 to-red-700",
      trend: "+18%",
      trendUp: true,
    },
    {
      title: "Total Soon to Expire",
      value: "5",
      icon: Clock,
      iconBg: "from-red-600 to-red-700",
      trend: "+10%",
      trendUp: true,
    },
    {
      title: "Total Reviews",
      value: "71",
      icon: Star,
      iconBg: "from-red-600 to-red-700",
      trend: "+9.23%",
      trendUp: true,
    },
    {
      title: "Total Storage Usage",
      value: "292.55 MB",
      icon: TrendingUp,
      iconBg: "from-red-600 to-red-700",
      trend: "+18%",
      trendUp: true,
    },
    {
      title: "Rest Content",
      value: "25",
      icon: Film,
      iconBg: "from-red-600 to-red-700",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Subscription Revenue",
      value: "₱205.00",
      icon: DollarSign,
      iconBg: "from-red-600 to-red-700",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Rent Revenue",
      value: "₱56.95",
      icon: DollarSign,
      iconBg: "from-red-600 to-red-700",
      trend: "+10%",
      trendUp: true,
    },
    {
      title: "Total Revenue",
      value: "₱261.95",
      icon: DollarSign,
      iconBg: "from-red-600 to-red-700",
      trend: "+12%",
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">2026-01-01 to 2026-06-</div>
          <Button className="bg-red-600 hover:bg-red-700 text-white rounded-lg">
            Submit
          </Button>
          <Button className="bg-red-500 hover:bg-red-600 text-white rounded-lg">
            Reset
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={idx}
              className="bg-zinc-900 border-zinc-800 text-white shadow-lg border-0 overflow-hidden"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.iconBg} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${stat.trendUp ? "text-green-500" : "text-red-500"}`}>
                    {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.trend}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Total Revenue Chart */}
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">Total Revenue</CardTitle>
            <Select defaultValue="year">
              <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700 text-white h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#71717a' }} />
                  <YAxis stroke="#71717a" tick={{ fill: '#71717a' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px' }}
                    labelStyle={{ color: '#e4e4e7' }}
                    itemStyle={{ color: '#ef4444' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#dc2626"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* New Subscribers Chart */}
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">New Subscribers</CardTitle>
            <Select defaultValue="year">
              <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700 text-white h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newSubscribersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#71717a' }} />
                  <YAxis stroke="#71717a" tick={{ fill: '#71717a' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px' }}
                    labelStyle={{ color: '#e4e4e7' }}
                  />
                  <Legend wrapperStyle={{ color: '#e4e4e7' }} />
                  <Bar dataKey="basic" fill="#dc2626" radius={[6, 6, 0, 0]} name="Basic" />
                  <Bar dataKey="premium" fill="#7f1d1d" radius={[6, 6, 0, 0]} name="Premium Plan" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Most Watched Chart */}
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg border-0 overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">Most Watched</CardTitle>
            <Select defaultValue="year">
              <SelectTrigger className="w-24 bg-zinc-800 border-zinc-700 text-white h-9 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mostWatchedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#71717a' }} />
                  <YAxis stroke="#71717a" tick={{ fill: '#71717a' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px' }}
                    labelStyle={{ color: '#e4e4e7' }}
                  />
                  <Legend wrapperStyle={{ color: '#e4e4e7' }} />
                  <Bar dataKey="movies" fill="#dc2626" radius={[6, 6, 0, 0]} name="Movies" />
                  <Bar dataKey="tvShows" fill="#7f1d1d" radius={[6, 6, 0, 0]} name="TV Shows" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Rated Chart */}
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg border-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-white">Top Rated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topGenresData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {topGenresData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {topGenresData.map((genre, index) => (
                <div key={index} className="flex items-center gap-1 text-xs text-gray-300">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span>{genre.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg border-0 overflow-hidden lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">Reviews</CardTitle>
            <Button variant="ghost" className="text-red-500 hover:text-red-400 p-0 h-auto text-sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto max-h-80 custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-gray-400">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Rating</th>
                </tr>
              </thead>
              <tbody>
                {reviewsData.map((review, index) => (
                  <tr key={index} className="border-b border-zinc-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-zinc-800 rounded-lg">
                          <AvatarFallback className="text-sm text-red-400">{review.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-gray-300">{review.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{review.date}</td>
                    <td className="py-3 px-4 text-gray-400">{review.category}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-lg border-0 overflow-hidden lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">Transactions</CardTitle>
            <Button variant="ghost" className="text-red-500 hover:text-red-400 p-0 h-auto text-sm">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto max-h-80 custom-scrollbar">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-gray-400">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Plan</th>
                  <th className="text-left py-3 px-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactionsData.map((transaction, index) => (
                  <tr key={index} className="border-b border-zinc-800/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 bg-zinc-800 rounded-lg">
                          <AvatarFallback className="text-xs text-red-400">{transaction.avatar}</AvatarFallback>
                        </Avatar>
                        <span className="text-gray-300">{transaction.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-400">{transaction.date}</td>
                    <td className="py-3 px-2 text-gray-400">{transaction.plan}</td>
                    <td className="py-3 px-2 text-white font-medium">{transaction.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
