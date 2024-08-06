import { useCallback, useEffect, useMemo, useState } from 'react'
import { isEqual, startOfDay } from 'date-fns'
import { getTokenHeaders } from '../../../../apis/seller/SellerAPI'

const useOrders = (storeId, loginId, selectedDate, orderType) => {
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [doneClickCountSetting, setDoneClickCountSetting] = useState(false)
    const [clickedCancelOrders, setClickedCancelOrders] = useState([])
    const [clickedDoneOrders, setClickedDoneOrders] = useState([])

    const addNewOrder = useCallback((newOrder) => {
        setOrders((prevOrders) => [...prevOrders, newOrder])
    }, [])

    const fetchOrders = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(
                `http://localhost:8080/api/orders/${storeId}`,
                { headers: getTokenHeaders() }
            )
            if (!response.ok) throw new Error('서버 응답이 실패했습니다')
            const data = await response.json()
            setOrders(data)
        } catch (error) {
            console.error('주문 목록을 불러오는데 실패했습니다:', error)
        } finally {
            setIsLoading(false)
        }
    }, [storeId])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    useEffect(() => {
        const fetchDoneClickCountSetting = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/sellers/${loginId}/count-setting`,
                    { headers: getTokenHeaders() }
                )
                if (!response.ok)
                    throw new Error('설정을 가져오는데 실패했습니다')
                const data = await response.json()
                setDoneClickCountSetting(data)
            } catch (error) {
                console.error('설정을 가져오는데 실패했습니다:', error)
            }
        }
        fetchDoneClickCountSetting()
    }, [loginId])

    const updateOrderStatus = useCallback((orderId, newStatus) => {
        setOrders((prevOrders) =>
            prevOrders.map((order) =>
                order.orderId === orderId
                    ? { ...order, status: newStatus }
                    : order
            )
        )
    }, [])

    const handleCancel = useCallback(
        async (orderId) => {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/orders/${orderId}/cancel`,
                    { method: 'PUT', headers: getTokenHeaders() }
                )
                if (!response.ok)
                    throw new Error('서버에서 주문 취소에 실패했습니다')
                updateOrderStatus(orderId, 2)
            } catch (error) {
                console.error('주문 취소 실패:', error)
            }
        },
        [updateOrderStatus]
    )

    const handleDone = useCallback(
        async (orderId) => {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/orders/${orderId}/complete`,
                    { method: 'PUT', headers: getTokenHeaders() }
                )
                if (!response.ok)
                    throw new Error('주문 완료 처리에 실패했습니다')
                updateOrderStatus(orderId, 1)
            } catch (error) {
                console.error('주문 완료 처리 실패:', error)
            }
        },
        [updateOrderStatus]
    )

    const handleAction = useCallback(
        async (orderId, actionType) => {
            const action = actionType === 'cancel' ? handleCancel : handleDone
            const clickedOrders =
                actionType === 'cancel'
                    ? clickedCancelOrders
                    : clickedDoneOrders
            const setClickedOrders =
                actionType === 'cancel'
                    ? setClickedCancelOrders
                    : setClickedDoneOrders

            if (doneClickCountSetting) {
                if (!clickedOrders.includes(orderId)) {
                    setClickedOrders((prev) => [...prev, orderId])
                    setTimeout(() => {
                        setClickedOrders((prev) =>
                            prev.filter((id) => id !== orderId)
                        )
                    }, 3000)
                } else {
                    await action(orderId)
                    setClickedOrders((prev) =>
                        prev.filter((id) => id !== orderId)
                    )
                }
            } else {
                await action(orderId)
            }
        },
        [
            doneClickCountSetting,
            clickedCancelOrders,
            clickedDoneOrders,
            handleCancel,
            handleDone,
        ]
    )

    const calculateOrderTotal = useCallback((order) => {
        return order.orderItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        )
    }, [])

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const orderDate = startOfDay(new Date(order.createdAt))
            const isToday = isEqual(orderDate, startOfDay(new Date()))
            const isSelectedDate = isEqual(orderDate, startOfDay(selectedDate))
            const statusCode =
                { received: 0, done: 1, canceled: 2 }[orderType] ?? -1
            return (
                order.status === statusCode &&
                (orderType === 'received' ? isToday : isSelectedDate)
            )
        })
    }, [orders, selectedDate, orderType])

    const tabTotal = useMemo(() => {
        return filteredOrders.reduce(
            (total, order) => total + calculateOrderTotal(order),
            0
        )
    }, [filteredOrders, calculateOrderTotal])

    return {
        orders,
        isLoading,
        doneClickCountSetting,
        clickedCancelOrders,
        clickedDoneOrders,
        handleAction,
        calculateOrderTotal,
        filteredOrders,
        tabTotal,
        addNewOrder,
    }
}

export default useOrders
