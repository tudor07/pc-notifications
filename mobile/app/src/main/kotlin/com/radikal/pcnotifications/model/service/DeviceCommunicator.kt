package com.radikal.pcnotifications.model.service

import com.radikal.pcnotifications.model.domain.Notification
import com.radikal.pcnotifications.model.domain.Sms

/**
 * Created by tudor on 21.02.2017.
 */
interface DeviceCommunicator {
    fun postNotification(notification: Notification)
    fun postSms(sms: Sms)
    fun connectToServer(ip: String, port: Int)
}