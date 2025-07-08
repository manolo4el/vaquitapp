"use client"

import type React from "react"
import { useState } from "react"
import { Input, Button, Typography, Card, Space } from "antd"

const { Title } = Typography

const UserProfilePage: React.FC = () => {
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [paymentInfo, setPaymentInfo] = useState<string>("")

  const handleSave = () => {
    // Implement save logic here (e.g., API call)
    console.log("Saving profile:", { name, email, paymentInfo })
  }

  return (
    <Card title={<Title level={3}>User Profile</Title>}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <Input
          id="paymentInfo"
          value={paymentInfo}
          onChange={(e) => setPaymentInfo(e.target.value)}
          placeholder="CBU, CVU o Alias"
          maxLength={22}
        />
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      </Space>
    </Card>
  )
}

export default UserProfilePage
