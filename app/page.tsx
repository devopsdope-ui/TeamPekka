"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Code,
  Database,
  GitBranch,
  Layers,
  Network,
  Zap,
  CheckCircle,
  Star,
  Users,
  Target,
  TrendingUp,
  Award,
  MessageSquare,
  Bot,
  GripVertical,
  Menu,
  X,
  Play,
  RotateCcw,
  Lightbulb,
  Trophy,
} from "lucide-react"

const dsaTopics = [
  {
    id: 1,
    title: "Arrays",
    icon: Database,
    description: "Linear data structure fundamentals",
    problems: 45,
    difficulty: "Beginner",
  },
  {
    id: 2,
    title: "Linked Lists",
    icon: GitBranch,
    description: "Dynamic memory allocation",
    problems: 32,
    difficulty: "Beginner",
  },
  {
    id: 3,
    title: "Stacks",
    icon: Layers,
    description: "LIFO data structure operations",
    problems: 28,
    difficulty: "Beginner",
  },
  {
    id: 4,
    title: "Queues",
    icon: Network,
    description: "FIFO data structure patterns",
    problems: 25,
    difficulty: "Beginner",
  },
  {
    id: 5,
    title: "Trees",
    icon: GitBranch,
    description: "Hierarchical data structures",
    problems: 52,
    difficulty: "Intermediate",
  },
  {
    id: 6,
    title: "Graphs",
    icon: Network,
    description: "Complex relationship modeling",
    problems: 38,
    difficulty: "Intermediate",
  },
  {
    id: 7,
    title: "Dynamic Programming",
    icon: Zap,
    description: "Optimization problem solving",
    problems: 41,
    difficulty: "Advanced",
  },
  {
    id: 8,
    title: "Hash Tables",
    icon: Database,
    description: "Key-value pair storage",
    problems: 35,
    difficulty: "Intermediate",
  },
  {
    id: 9,
    title: "Heaps",
    icon: Layers,
    description: "Priority queue implementation",
    problems: 22,
    difficulty: "Intermediate",
  },
  {
    id: 10,
    title: "Sorting Algorithms",
    icon: TrendingUp,
    description: "Data ordering techniques",
    problems: 18,
    difficulty: "Beginner",
  },
  {
    id: 11,
    title: "Searching Algorithms",
    icon: Target,
    description: "Data retrieval methods",
    problems: 15,
    difficulty: "Beginner",
  },
  {
    id: 12,
    title: "Greedy Algorithms",
    icon: Zap,
    description: "Optimal choice strategies",
    problems: 28,
    difficulty: "Advanced",
  },
]

const codingProblems = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    acceptance: "56%",
    solved: true,
    category: "Array",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
    ],
    constraints: ["2 ≤ nums.length ≤ 10⁴", "-10⁹ ≤ nums[i] ≤ 10⁹", "-10⁹ ≤ target ≤ 10⁹"],
    starterCode: {
      python: "def twoSum(nums, target):\n    # Your code here\n    pass",
      javascript: "function twoSum(nums, target) {\n    // Your code here\n}",
      cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    // Your code here\n}",
    },
  },
  {
    id: 2,
    title: "Valid Parentheses",
    difficulty: "Easy",
    acceptance: "42%",
    solved: true,
    category: "Stack",
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      {
        input: 's = "()"',
        output: "true",
        explanation: "The parentheses are properly matched.",
      },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁴", "s consists of parentheses only '()[]{}'."],
    starterCode: {
      python: "def isValid(s):\n    # Your code here\n    pass",
      javascript: "function isValid(s) {\n    // Your code here\n}",
      cpp: "bool isValid(string s) {\n    // Your code here\n}",
    },
  },
  {
    id: 3,
    title: "Maximum Subarray",
    difficulty: "Medium",
    acceptance: "49%",
    solved: false,
    category: "Dynamic Programming",
    description:
      "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "[4,-1,2,1] has the largest sum = 6.",
      },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    starterCode: {
      python: "def maxSubArray(nums):\n    # Your code here\n    pass",
      javascript: "function maxSubArray(nums) {\n    // Your code here\n}",
      cpp: "int maxSubArray(vector<int>& nums) {\n    // Your code here\n}",
    },
  },
  {
    id: 4,
    title: "Binary Tree Inorder Traversal",
    difficulty: "Easy",
    acceptance: "74%",
    solved: true,
    category: "Tree",
    description: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    examples: [
      {
        input: "root = [1,null,2,3]",
        output: "[1,3,2]",
        explanation: "Inorder traversal visits left, root, then right.",
      },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 100].", "-100 ≤ Node.val ≤ 100"],
    starterCode: {
      python: "def inorderTraversal(root):\n    # Your code here\n    pass",
      javascript: "function inorderTraversal(root) {\n    // Your code here\n}",
      cpp: "vector<int> inorderTraversal(TreeNode* root) {\n    // Your code here\n}",
    },
  },
  {
    id: 5,
    title: "Climbing Stairs",
    difficulty: "Easy",
    acceptance: "52%",
    solved: false,
    category: "Dynamic Programming",
    description:
      "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      {
        input: "n = 2",
        output: "2",
        explanation: "There are two ways: 1. 1 step + 1 step 2. 2 steps",
      },
    ],
    constraints: ["1 ≤ n ≤ 45"],
    starterCode: {
      python: "def climbStairs(n):\n    # Your code here\n    pass",
      javascript: "function climbStairs(n) {\n    // Your code here\n}",
      cpp: "int climbStairs(int n) {\n    // Your code here\n}",
    },
  },
]

const sampleProblems = [
  { id: 1, title: "Two Sum", difficulty: "Easy", acceptance: "56%", solved: true },
  { id: 2, title: "Largest Triangle Area", difficulty: "Easy", acceptance: "66%", solved: false },
  { id: 3, title: "Valid Parentheses", difficulty: "Easy", acceptance: "42%", solved: true },
  { id: 4, title: "Merge Two Sorted Lists", difficulty: "Easy", acceptance: "61%", solved: false },
  { id: 5, title: "Maximum Subarray", difficulty: "Medium", acceptance: "49%", solved: false },
  { id: 6, title: "Binary Tree Inorder Traversal", difficulty: "Easy", acceptance: "74%", solved: true },
  { id: 7, title: "Climbing Stairs", difficulty: "Easy", acceptance: "52%", solved: false },
  { id: 8, title: "Best Time to Buy and Sell Stock", difficulty: "Easy", acceptance: "54%", solved: true },
]

const features = [
  {
    icon: Target,
    title: "Structured Learning Paths",
    description: "Follow curated roadmaps designed by industry experts",
  },
  { icon: Bot, title: "AI-Powered Doubt Solver", description: "Get instant help with personalized explanations" },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Monitor your learning journey with detailed analytics",
  },
  { icon: Users, title: "Community Support", description: "Connect with fellow learners and mentors" },
  { icon: Award, title: "Certification Ready", description: "Prepare for technical interviews and certifications" },
  { icon: MessageSquare, title: "Interactive Discussions", description: "Engage in problem-solving discussions" },
]

const testimonials = [
  {
    name: "John Doe",
    role: "Software Engineer",
    rating: 5,
    text: "Great for interviews! The structured approach helped me land my dream job.",
  },
  {
    name: "Sarah Chen",
    role: "CS Student",
    rating: 5,
    text: "AI tutor is amazing. It explains concepts in a way that actually makes sense.",
  },
  {
    name: "Mike Johnson",
    role: "Full Stack Developer",
    rating: 4,
    text: "Comprehensive content and great community. Highly recommend for DSA prep.",
  },
]

export default function TeamPekka() {
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null)
  const [draggedTopic, setDraggedTopic] = useState<number | null>(null)
  const [topicOrder, setTopicOrder] = useState(dsaTopics)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [selectedProblem, setSelectedProblem] = useState<number | null>(null)
  const [currentLanguage, setCurrentLanguage] = useState<"python" | "javascript" | "cpp">("python")
  const [userCode, setUserCode] = useState("")
  const [testResults, setTestResults] = useState<string>("")
  const [aiHint, setAiHint] = useState<string>("")
  const [showProblemDashboard, setShowProblemDashboard] = useState(false)
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All")
  const [categoryFilter, setCategoryFilter] = useState<string>("All")

  const handleDragStart = (e: React.DragEvent, topicId: number) => {
    setDraggedTopic(topicId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()
    if (draggedTopic === null) return

    const draggedIndex = topicOrder.findIndex((topic) => topic.id === draggedTopic)
    const targetIndex = topicOrder.findIndex((topic) => topic.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newOrder = [...topicOrder]
    const [draggedItem] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedItem)

    setTopicOrder(newOrder)
    setDraggedTopic(null)
  }

  const handleRunCode = () => {
    // Simulate code execution
    setTestResults("Running tests...")
    setTimeout(() => {
      const isCorrect = Math.random() > 0.5
      if (isCorrect) {
        setTestResults("✅ All test cases passed!\nExecution time: 45ms\nMemory usage: 14.2MB")
        setAiHint("")
      } else {
        setTestResults("❌ Test case 2 failed\nExpected: [0,1]\nActual: [1,0]\nExecution time: 52ms")
        setAiHint(
          "💡 AI Hint: Your logic is correct, but check the order of indices you're returning. The problem asks for indices in ascending order.",
        )
      }
    }, 1500)
  }

  const handleSubmitCode = () => {
    setTestResults("Submitting solution...")
    setTimeout(() => {
      const isAccepted = Math.random() > 0.3
      if (isAccepted) {
        setTestResults(
          "🎉 Accepted!\nRuntime: 45ms (beats 85.2% of submissions)\nMemory: 14.2MB (beats 92.1% of submissions)",
        )
        setAiHint("")
        // Mark problem as solved
        const problemIndex = codingProblems.findIndex((p) => p.id === selectedProblem)
        if (problemIndex !== -1) {
          codingProblems[problemIndex].solved = true
        }
      } else {
        setTestResults(
          "❌ Wrong Answer\nTest case 3 failed\nInput: [3,2,4], target = 6\nExpected: [1,2]\nActual: [0,2]",
        )
        setAiHint(
          "🤖 AI Debug: Your algorithm might not be handling duplicate values correctly. Consider using a hash map to store values and their indices. Also, make sure you're not using the same element twice.",
        )
      }
    }, 2000)
  }

  const getFilteredProblems = () => {
    return codingProblems.filter((problem) => {
      const matchesDifficulty = difficultyFilter === "All" || problem.difficulty === difficultyFilter
      const matchesCategory = categoryFilter === "All" || problem.category === categoryFilter
      return matchesDifficulty && matchesCategory
    })
  }

  const getCurrentProblem = () => {
    return codingProblems.find((p) => p.id === selectedProblem)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-400"
      case "Medium":
        return "text-yellow-400"
      case "Hard":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header/Navbar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">TEAM PEKKA</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => {
                setShowProblemDashboard(false)
                setSelectedProblem(null)
              }}
              className="hover:text-primary transition-colors"
            >
              Topics
            </button>
            <button onClick={() => setShowProblemDashboard(true)} className="hover:text-primary transition-colors">
              Problems
            </button>
            <a href="#features" className="hover:text-primary transition-colors">
              Features
            </a>
            <a href="#testimonials" className="hover:text-primary transition-colors">
              About
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button className="bg-primary hover:bg-primary/90 hidden sm:inline-flex">Get Started</Button>
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-sm">
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              <button
                onClick={() => {
                  setShowProblemDashboard(false)
                  setSelectedProblem(null)
                  setMobileMenuOpen(false)
                }}
                className="hover:text-primary transition-colors text-left"
              >
                Topics
              </button>
              <button
                onClick={() => {
                  setShowProblemDashboard(true)
                  setMobileMenuOpen(false)
                }}
                className="hover:text-primary transition-colors text-left"
              >
                Problems
              </button>
              <a
                href="#features"
                className="hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <Button className="bg-primary hover:bg-primary/90 w-full">Get Started</Button>
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6">
        {selectedProblem ? (
          // Code Editor View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
            {/* Problem Statement */}
            <div className="lg:col-span-1 overflow-y-auto custom-scrollbar">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProblem(null)}>
                      ← Back to Problems
                    </Button>
                  </div>
                  <CardTitle className="text-xl">{getCurrentProblem()?.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(getCurrentProblem()?.difficulty || "")}>
                      {getCurrentProblem()?.difficulty}
                    </Badge>
                    <Badge variant="secondary">{getCurrentProblem()?.category}</Badge>
                    <span className="text-sm text-muted-foreground">{getCurrentProblem()?.acceptance}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{getCurrentProblem()?.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Examples</h4>
                    {getCurrentProblem()?.examples.map((example, index) => (
                      <div key={index} className="bg-muted p-3 rounded-lg mb-2">
                        <div className="text-sm">
                          <div>
                            <strong>Input:</strong> {example.input}
                          </div>
                          <div>
                            <strong>Output:</strong> {example.output}
                          </div>
                          <div>
                            <strong>Explanation:</strong> {example.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Constraints</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {getCurrentProblem()?.constraints.map((constraint, index) => (
                        <li key={index}>• {constraint}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Code Editor */}
            <div className="lg:col-span-1">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Code Editor</CardTitle>
                    <Select
                      value={currentLanguage}
                      onValueChange={(value: "python" | "javascript" | "cpp") => {
                        setCurrentLanguage(value)
                        setUserCode(getCurrentProblem()?.starterCode[value] || "")
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <Textarea
                    value={userCode || getCurrentProblem()?.starterCode[currentLanguage] || ""}
                    onChange={(e) => setUserCode(e.target.value)}
                    className="flex-1 font-mono text-sm resize-none"
                    placeholder="Write your code here..."
                  />
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleRunCode} variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Run
                    </Button>
                    <Button onClick={handleSubmitCode} className="bg-primary hover:bg-primary/90" size="sm">
                      Submit
                    </Button>
                    <Button variant="ghost" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Output & AI Hints */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg min-h-[100px]">
                    {testResults || "Run your code to see results..."}
                  </pre>
                </CardContent>
              </Card>

              {aiHint && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      AI Debugging Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{aiHint}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progress Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Problems Solved</span>
                    <Badge variant="secondary">3/5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm text-primary">60%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Streak</span>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span className="text-sm">5 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : showProblemDashboard ? (
          // Problem Dashboard
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-3xl font-bold">Problem Dashboard</h2>
              <div className="flex gap-4">
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Levels</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Topics</SelectItem>
                    <SelectItem value="Array">Array</SelectItem>
                    <SelectItem value="Stack">Stack</SelectItem>
                    <SelectItem value="Tree">Tree</SelectItem>
                    <SelectItem value="Dynamic Programming">Dynamic Programming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4">
              {getFilteredProblems().map((problem) => (
                <Card
                  key={problem.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedProblem(problem.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {problem.solved ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{problem.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{problem.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{problem.category}</Badge>
                        <Badge className={getDifficultyColor(problem.difficulty)}>{problem.difficulty}</Badge>
                        <span className="text-sm text-muted-foreground">{problem.acceptance}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Original DSA Topics View
          <>
            {/* Hero Section */}
            <section className="text-center py-8 md:py-16 mb-8 md:mb-16">
              <h2 className="text-3xl md:text-6xl font-bold mb-4 text-balance">
                Master <span className="text-primary">Data Structures</span> & Algorithms
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto">
                Interactive learning platform with drag-and-drop topic organization, comprehensive problem sets, and
                AI-powered assistance
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowProblemDashboard(true)}
                >
                  Start Coding
                </Button>
                <Button size="lg" variant="outline">
                  Explore Topics
                </Button>
              </div>
            </section>

            {/* DSA Topics Section */}
            <section id="topics" className="mb-12 md:mb-16">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">Explore DSA Topics</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <GripVertical className="h-4 w-4" />
                  Drag to reorder topics
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                {topicOrder.map((topic) => {
                  const IconComponent = topic.icon
                  return (
                    <Card
                      key={topic.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, topic.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, topic.id)}
                      className={`cursor-pointer hover:shadow-lg transition-all hover:scale-105 bg-card border-border ${
                        draggedTopic === topic.id ? "opacity-50 scale-95" : ""
                      } ${selectedTopic === topic.id ? "ring-2 ring-primary" : ""}`}
                      onClick={() => setSelectedTopic(selectedTopic === topic.id ? null : topic.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base md:text-lg leading-tight">{topic.title}</CardTitle>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {topic.problems} problems
                                </Badge>
                                <Badge className={`text-xs border ${getDifficultyColor(topic.difficulty)}`}>
                                  {topic.difficulty}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-sm">{topic.description}</CardDescription>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>

            {/* Topic Detail View */}
            {selectedTopic && (
              <section className="mb-12 md:mb-16 p-4 md:p-6 bg-card rounded-lg border border-border">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-0">
                    {topicOrder.find((t) => t.id === selectedTopic)?.title} - Problems & Theory
                  </h3>
                  <Button variant="outline" onClick={() => setSelectedTopic(null)}>
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                  {/* Problems List */}
                  <div>
                    <h4 className="text-lg md:text-xl font-semibold mb-4">Practice Problems</h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                      {sampleProblems.map((problem) => (
                        <div key={problem.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {problem.solved ? (
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                            )}
                            <span className="font-medium truncate">{problem.title}</span>
                          </div>
                          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                            <span
                              className={`text-xs md:text-sm font-medium difficulty-${problem.difficulty.toLowerCase()}`}
                            >
                              {problem.difficulty}
                            </span>
                            <span className="text-xs md:text-sm text-muted-foreground">{problem.acceptance}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Theory Section */}
                  <div>
                    <h4 className="text-lg md:text-xl font-semibold mb-4">Theory & Concepts</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                      <div>
                        <h5 className="text-base md:text-lg font-medium mb-2">What is an Array?</h5>
                        <p className="text-sm md:text-base text-muted-foreground mb-3">
                          An array is a linear data structure that stores elements of the same type in contiguous memory
                          locations.
                        </p>
                      </div>
                      <div>
                        <h5 className="text-base md:text-lg font-medium mb-2">Key Operations</h5>
                        <ul className="list-disc list-inside text-sm md:text-base text-muted-foreground space-y-1">
                          <li>Access: O(1) - Direct index access</li>
                          <li>Search: O(n) - Linear search through elements</li>
                          <li>Insertion: O(n) - May require shifting elements</li>
                          <li>Deletion: O(n) - May require shifting elements</li>
                        </ul>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <h5 className="text-base md:text-lg font-medium mb-2">Code Example</h5>
                        <pre className="text-xs md:text-sm text-primary font-mono overflow-x-auto">
                          {`// Array initialization\nint[] arr = new int[5];\narr[0] = 10; // O(1) access\n\n// Array traversal\nfor(int i = 0; i < arr.length; i++) {\n    System.out.println(arr[i]);\n}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Features Section */}
            <section id="features" className="mb-12 md:mb-16">
              <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Choose TEAM PEKKA Hub?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => {
                  const IconComponent = feature.icon
                  return (
                    <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-card border-border">
                      <CardHeader>
                        <IconComponent className="h-10 w-10 md:h-12 md:w-12 text-primary mx-auto mb-4" />
                        <CardTitle className="text-lg md:text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm md:text-base">{feature.description}</CardDescription>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">What Our Students Say</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-center space-x-1 mb-2">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.role}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm md:text-base text-muted-foreground italic">"{testimonial.text}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
